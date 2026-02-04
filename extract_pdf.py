import PyPDF2
import sys
import io

# Set UTF-8 encoding for stdout
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

pdf_path = r'D:\APU\DEGREE YEAR 3 FINAL SEM\FYP\FYP PART 2\CHAI_CHARNG_SHIN_TP065365.pdf'

try:
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ''
        for page in reader.pages:
            text += page.extract_text() + '\n'
        
        # Print the extracted text
        print(text)
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
