import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { email, csvData, fileName } = await request.json();

    // Create transporter using Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });

    // Create email content
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'TOPSIS Analysis Results',
      text: `Your TOPSIS analysis results are attached.\n\nFile: ${fileName}\n\nThank you for using TOPSIS Calculator!`,
      attachments: [{
        filename: `result_${fileName}`,
        content: csvData,
        contentType: 'text/csv'
      }]
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ 
      success: true, 
      message: `Results sent to ${email}` 
    });

  } catch (error) {
    console.error('Email sending failed:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to send email' 
    }, { status: 500 });
  }
}