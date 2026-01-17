

from flask import Flask, request, render_template_string
import os
import re
from topsis_surya import run_topsis
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

HTML_FORM = '''
<!doctype html>
<title>TOPSIS Web Service</title>
<h2>TOPSIS Web Service</h2>
<form method=post enctype=multipart/form-data>
  <label>Input CSV File: <input type=file name=input_file required></label><br><br>
  <label>Weights: <input type=text name=weights required placeholder="1,1,1,1"></label><br><br>
  <label>Impacts: <input type=text name=impacts required placeholder="+,+,-,+"></label><br><br>
  <label>Email: <input type=email name=email required></label><br><br>
  <input type=submit value=Submit>
</form>
<p>{{ message }}</p>
'''

def send_email_with_attachment(to_email, subject, body, attachment_path):
    EMAIL_ADDRESS = os.getenv('EMAIL_ADDRESS')
    EMAIL_PASSWORD = os.getenv('EMAIL_PASSWORD')
    SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
    SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
    if not EMAIL_ADDRESS or not EMAIL_PASSWORD:
        raise Exception('Email credentials not set in .env file')
    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = EMAIL_ADDRESS
    msg['To'] = to_email
    msg.set_content(body)
    with open(attachment_path, 'rb') as f:
        msg.add_attachment(f.read(), maintype='application', subtype='octet-stream', filename=os.path.basename(attachment_path))
    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as smtp:
        smtp.starttls()
        smtp.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        smtp.send_message(msg)

@app.route('/', methods=['GET', 'POST'])
def index():
    message = ''
    if request.method == 'POST':
        try:
            file = request.files['input_file']
            weights = request.form['weights']
            impacts = request.form['impacts']
            email = request.form['email']
            # Email validation
            if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
                raise Exception("Invalid email format")
            # Save file
            filepath = os.path.join(UPLOAD_FOLDER, file.filename)
            file.save(filepath)
            output_path = os.path.join(UPLOAD_FOLDER, 'result_' + file.filename)
            run_topsis(filepath, weights, impacts, output_path)
            send_email_with_attachment(email, 'TOPSIS Result', 'Find attached your TOPSIS result.', output_path)
            message = 'Result sent to your email!'
        except Exception as e:
            message = f'Error: {e}'
    return render_template_string(HTML_FORM, message=message)

if __name__ == '__main__':
    app.run(debug=True)
