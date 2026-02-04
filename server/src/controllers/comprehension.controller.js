const prisma = require('../utils/prisma');

// Create comprehension question (Tutor only)
exports.createQuestion = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { question, options, correctAnswer, order } = req.body;
        const tutorId = req.user.id;

        console.log('Creating question for lesson:', lessonId);
        console.log('Question data:', { question, options, correctAnswer, order });

        // Verify tutor owns the lesson's course
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: { course: { select: { tutorId: true } } }
        });

        console.log('Lesson found:', !!lesson);
        console.log('Course tutor ID:', lesson?.course?.tutorId);
        console.log('Request tutor ID:', tutorId);
        console.log('IDs match:', lesson?.course?.tutorId === tutorId);

        if ((!lesson || lesson.course.tutorId !== tutorId) && req.user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const comprehensionQuestion = await prisma.comprehensionQuestion.create({
            data: {
                lessonId,
                question,
                options: JSON.stringify(options),
                correctAnswer,
                order: order || 0
            }
        });

        res.json({
            success: true,
            data: comprehensionQuestion
        });
    } catch (error) {
        console.error('Create question error:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Failed to create question',
            error: error.message
        });
    }
};

// Get questions for a lesson
exports.getQuestions = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        const questions = await prisma.comprehensionQuestion.findMany({
            where: { lessonId },
            orderBy: { order: 'asc' }
        });

        // For students, don't send correct answers
        const questionsData = questions.map(q => {
            const questionData = {
                id: q.id,
                question: q.question,
                options: JSON.parse(q.options),
                order: q.order
            };

            // Only include correct answer for tutors/admins
            if (userRole === 'TUTOR' || userRole === 'ADMIN') {
                questionData.correctAnswer = q.correctAnswer;
            }

            return questionData;
        });

        res.json({
            success: true,
            data: questionsData
        });
    } catch (error) {
        console.error('Get questions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get questions'
        });
    }
};

// Submit comprehension answers
exports.submitAnswers = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { answers } = req.body; // Array of { questionId, answer }
        const userId = req.user.id;

        // Get all questions for this lesson
        const questions = await prisma.comprehensionQuestion.findMany({
            where: { lessonId }
        });

        let correctCount = 0;
        const responses = [];

        // Process each answer
        for (const ans of answers) {
            const question = questions.find(q => q.id === ans.questionId);
            if (!question) continue;

            const isCorrect = question.correctAnswer === ans.answer;
            if (isCorrect) correctCount++;

            // Save response
            const response = await prisma.comprehensionResponse.create({
                data: {
                    questionId: ans.questionId,
                    studentId: userId,
                    lessonId,
                    answer: ans.answer,
                    isCorrect
                }
            });

            responses.push({
                questionId: ans.questionId,
                isCorrect,
                correctAnswer: question.correctAnswer
            });
        }

        const score = questions.length > 0
            ? Math.round((correctCount / questions.length) * 100)
            : 0;

        // Update the latest active session with the score
        const activeSession = await prisma.lessonSession.findFirst({
            where: {
                lessonId,
                studentId: userId,
                completedAt: null
            },
            orderBy: { startedAt: 'desc' }
        });

        if (activeSession) {
            await prisma.lessonSession.update({
                where: { id: activeSession.id },
                data: { score }
            });
        }

        res.json({
            success: true,
            data: {
                score,
                correctCount,
                totalQuestions: questions.length,
                responses
            }
        });
    } catch (error) {
        console.error('Submit answers error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit answers'
        });
    }
};

// Update question (Tutor only)
exports.updateQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const { question, options, correctAnswer, order } = req.body;
        const tutorId = req.user.id;

        console.log('Updating question:', id);
        console.log('Update data:', { question, options, correctAnswer, order });

        // Verify ownership
        const existingQuestion = await prisma.comprehensionQuestion.findUnique({
            where: { id },
            include: {
                lesson: {
                    include: { course: { select: { tutorId: true } } }
                }
            }
        });

        if ((!existingQuestion || existingQuestion.lesson.course.tutorId !== tutorId) && req.user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const updated = await prisma.comprehensionQuestion.update({
            where: { id },
            data: {
                question,
                options: options ? JSON.stringify(options) : undefined,
                correctAnswer,
                order
            }
        });

        res.json({
            success: true,
            data: updated
        });
    } catch (error) {
        console.error('Update question error:', error);
        console.error('Error details:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to update question',
            error: error.message
        });
    }
};

// Delete question (Tutor only)
exports.deleteQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const tutorId = req.user.id;

        // Verify ownership
        const question = await prisma.comprehensionQuestion.findUnique({
            where: { id },
            include: {
                lesson: {
                    include: { course: { select: { tutorId: true } } }
                }
            }
        });

        if ((!question || question.lesson.course.tutorId !== tutorId) && req.user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        await prisma.comprehensionQuestion.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: 'Question deleted successfully'
        });
    } catch (error) {
        console.error('Delete question error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete question'
        });
    }
};
