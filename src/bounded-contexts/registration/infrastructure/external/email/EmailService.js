import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export class EmailService {
  constructor() {
    this._transporter = null;
    this._initializeTransporter();
  }

  _initializeTransporter() {
    this._transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendPasswordResetEmail(email, resetToken, resetUrl) {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("SMTP không được cấu hình. Không thể gửi email.");
        console.log("Reset token (chỉ để test):", resetToken);
        console.log("Reset URL:", resetUrl);
        return { success: false, message: "SMTP chưa được cấu hình" };
      }

      const mailOptions = {
        from: `"Drug Traceability System" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Yêu cầu đặt lại mật khẩu",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color:rgb(76, 91, 175); color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background-color: #f9f9f9; }
              .button { display: inline-block; padding: 12px 30px; background-color:rgb(101, 107, 232); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
              .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Đặt lại mật khẩu</h1>
              </div>
              <div class="content">
                <p>Xin chào,</p>
                <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
                
                <p>Vui lòng nhấp vào nút bên dưới để đặt lại mật khẩu của bạn:</p>
                <p style="text-align: center;">
                  <a href="${resetUrl}" class="button">Đặt lại mật khẩu</a>
                </p>
                
                <p>Hoặc copy và paste link này vào trình duyệt:</p>
                <p style="word-break: break-all; color:rgb(91, 157, 223);">${resetUrl}</p>
                
                <div class="warning">
                  <strong>Lưu ý:</strong>
                  <ul>
                    <li>Link này có hiệu lực trong 1 giờ</li>
                    <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
                    <li>Không chia sẻ link này với bất kỳ ai</li>
                  </ul>
                </div>
                
                <p>Nếu bạn không thực hiện yêu cầu này, bạn có thể bỏ qua email này một cách an toàn.</p>
                
                <p>Trân trọng,<br>Đội ngũ Drug Traceability System</p>
              </div>
              <div class="footer">
                <p>Email này được gửi tự động, vui lòng không trả lời.</p>
                <p>&copy; ${new Date().getFullYear()} Drug Traceability System. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
          Yêu cầu đặt lại mật khẩu
          
          Xin chào,
          
          Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.
          
          Vui lòng truy cập link sau để đặt lại mật khẩu:
          ${resetUrl}
          
          Link này có hiệu lực trong 1 giờ.
          
          Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
          
          Trân trọng,
          Đội ngũ Drug Traceability System
        `,
      };

      await this._transporter.sendMail(mailOptions);
      return { success: true, message: "Email đã được gửi thành công" };
    } catch (error) {
      console.error("Lỗi khi gửi email reset mật khẩu:", error);
      throw error;
    }
  }

  async sendNewPasswordEmail(email, newPassword, username) {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("SMTP không được cấu hình. Không thể gửi email.");
        console.log("Mật khẩu mới (chỉ để test):", newPassword);
        return { success: false, message: "SMTP chưa được cấu hình" };
      }

      const mailOptions = {
        from: `"Drug Traceability System" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Mật khẩu mới của bạn",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color:rgb(76, 91, 175); color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background-color: #f9f9f9; }
              .password-box { background-color: #e7f3ff; border: 2px solid #2196F3; padding: 15px; margin: 20px 0; text-align: center; font-size: 18px; font-weight: bold; letter-spacing: 2px; }
              .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 20px 0; }
              .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Mật khẩu mới của bạn</h1>
              </div>
              <div class="content">
                <p>Xin chào <strong>${username}</strong>,</p>
                
                <p>Yêu cầu reset mật khẩu của bạn đã được admin phê duyệt.</p>
                
                <p>Mật khẩu mới của bạn là:</p>
                <div class="password-box">${newPassword}</div>
                
                <div class="warning">
                  <strong>Lưu ý quan trọng:</strong>
                  <ul>
                    <li>Vui lòng đổi mật khẩu này ngay sau khi đăng nhập</li>
                    <li>Không chia sẻ mật khẩu này với bất kỳ ai</li>
                    <li>Nếu bạn không yêu cầu reset mật khẩu, vui lòng liên hệ admin ngay lập tức</li>
                  </ul>
                </div>
                
                <p>Vui lòng đăng nhập và đổi mật khẩu ngay để bảo mật tài khoản của bạn.</p>
                
                <p>Trân trọng,<br>Đội ngũ Drug Traceability System</p>
              </div>
              <div class="footer">
                <p>Email này được gửi tự động, vui lòng không trả lời.</p>
                <p>&copy; ${new Date().getFullYear()} Drug Traceability System. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
          Mật khẩu mới của bạn
          
          Xin chào ${username},
          
          Yêu cầu reset mật khẩu của bạn đã được admin phê duyệt.
          
          Mật khẩu mới của bạn là: ${newPassword}
          
          Vui lòng đăng nhập và đổi mật khẩu ngay để bảo mật tài khoản của bạn.
          
          Trân trọng,
          Đội ngũ Drug Traceability System
        `,
      };

      await this._transporter.sendMail(mailOptions);
      return { success: true, message: "Email đã được gửi thành công" };
    } catch (error) {
      console.error("Lỗi khi gửi email mật khẩu mới:", error);
      throw error;
    }
  }

  async sendPasswordResetApprovedEmail(email, username) {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("SMTP không được cấu hình. Không thể gửi email.");
        return { success: false, message: "SMTP chưa được cấu hình" };
      }

      const mailOptions = {
        from: `"Drug Traceability System" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Yêu cầu reset mật khẩu đã được duyệt",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color:rgb(76, 91, 175); color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; background-color: #f9f9f9; }
              .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Yêu cầu đã được duyệt</h1>
              </div>
              <div class="content">
                <p>Xin chào <strong>${username}</strong>,</p>
                
                <p>Yêu cầu reset mật khẩu của bạn đã được admin phê duyệt.</p>
                
                <p>Mật khẩu mới sẽ được gửi đến email này trong thời gian sớm nhất.</p>
                
                <p>Trân trọng,<br>Đội ngũ Drug Traceability System</p>
              </div>
              <div class="footer">
                <p>Email này được gửi tự động, vui lòng không trả lời.</p>
                <p>&copy; ${new Date().getFullYear()} Drug Traceability System. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      await this._transporter.sendMail(mailOptions);
      return { success: true, message: "Email đã được gửi thành công" };
    } catch (error) {
      console.error("Lỗi khi gửi email:", error);
      throw error;
    }
  }
}

