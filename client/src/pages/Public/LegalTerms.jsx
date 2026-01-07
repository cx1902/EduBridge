import React from 'react';
import './LegalStyles.css';

const LegalTerms = () => {
    return (
        <div className="public-page-container">
            <div className="public-header">
                <h1>Terms of Service</h1>
                <p>Last updated: January 1, 2026</p>
            </div>

            <div className="legal-content">
                <h2>1. Agreement to Terms</h2>
                <p>By accessing or using our services, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.</p>

                <h2>2. Intellectual Property</h2>
                <p>The Service and its original content, features and functionality are and will remain the exclusive property of EduBridge and its licensors. The Service is protected by copyright, trademark, and other laws of both the Country and foreign countries.</p>

                <h2>3. User Accounts</h2>
                <p>When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.</p>
                <p>You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password, whether your password is with our Service or a third-party service.</p>

                <h2>4. Termination</h2>
                <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
                <p>Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may simply discontinue using the Service.</p>

                <h2>5. Limitation of Liability</h2>
                <p>In no event shall EduBridge, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence) or any other legal theory, whether or not we have been informed of the possibility of such damage.</p>

                <h2>6. Governing Law</h2>
                <p>These Terms shall be governed and construed in accordance with the laws of Malaysia, without regard to its conflict of law provisions.</p>

                <h2>7. Changes</h2>
                <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</p>

                <h2>8. Contact Us</h2>
                <p>If you have any questions about these Terms, please contact us at support@edubridge.com.</p>
            </div>
        </div>
    );
};

export default LegalTerms;
