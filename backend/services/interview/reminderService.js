import db from "../../config/db.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// ======================================================
// EMAIL TRANSPORTER
// ======================================================

const transporter = nodemailer.createTransport({

    service: "gmail",

    auth: {
        user: process.env.MAIL_USER,
        pass:process.env.MAIL_PASS
    }

});

export const sendInterviewReminders = async () => {

    try {

        console.log(
            "[MAIL] Đang kiểm tra lịch..."
        );


        const [rows] = await db.execute(
            `
            SELECT
                i.id,
                i.user_id,
                i.company,
                i.position,
                i.interview_date,
                i.start_time,
                i.interview_type,
                i.interview_link,
                i.location,
                i.note,
                i.reminder_minutes,
                u.email,
                u.first_name,
                u.last_name

            FROM interviews i

            INNER JOIN users u
                ON u.id = i.user_id

            WHERE
                i.reminder_enabled = 1
                AND i.reminder_sent = 0
                AND i.status = 'scheduled'

                AND TIMESTAMP(
                    i.interview_date,
                    i.start_time
                ) > NOW()

                AND TIMESTAMP(
                    i.interview_date,
                    i.start_time
                ) <= DATE_ADD(
                    NOW(),
                    INTERVAL i.reminder_minutes MINUTE
                )

            ORDER BY
                i.interview_date ASC,
                i.start_time ASC
            `
        );



        if (rows.length === 0) {
            return;
        }


        for (const interview of rows) {

            try {

                console.log(
                    `[MAIL] Đang gửi interview #${interview.id} -> ${interview.email}`
                );


                await sendReminderEmail(
                    interview
                );


                await db.execute(
                    `
                    UPDATE interviews

                    SET
                        reminder_sent = 1,
                        reminder_sent_at = NOW()

                    WHERE id = ?

                    AND reminder_sent = 0
                    `,
                    [
                        interview.id
                    ]
                );


                console.log(
                    `[MAIL] Đã gửi thành công interview #${interview.id}`
                );

            } catch (error) {

                console.error(
                    `[MAIL] Gửi thất bại interview #${interview.id}:`,
                    error
                );

            }

        }

    } catch (error) {

        console.error(
            "[MAIL] CHECK ERROR:",
            error
        );

    }

};

const sendReminderEmail = async (
    interview
) => {

    const fullName =
        [
            interview.first_name,
            interview.last_name
        ]
            .filter(Boolean)
            .join(" ") ||
        "Bạn";


    const interviewDate =
        new Date(
            `${interview.interview_date}T00:00:00`
        );


    const formattedDate =
        interviewDate.toLocaleDateString(
            "vi-VN",
            {
                weekday: "long",
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }
        );


    const interviewTime =
        String(
            interview.start_time
        ).slice(0, 5);


    const isOnline =
        interview.interview_type === "online";


    const meetingInfo =
        isOnline

            ? `
                <p>
                    <strong>
                        Link phỏng vấn:
                    </strong>

                    <br>

                    <a href="${interview.interview_link}">
                        ${interview.interview_link}
                    </a>
                </p>
            `

            : `
                <p>
                    <strong>
                        Địa điểm:
                    </strong>

                    <br>

                    ${interview.location || "Chưa cập nhật"}
                </p>
            `;


    await transporter.sendMail({

        from:
            `"CV Studio" <${process.env.MAIL_USER}>`,

        to:
            interview.email,

        subject:
            `Nhắc lịch phỏng vấn - ${interview.company}`,

        html: `

            <div
                style="
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: auto;
                    padding: 30px;
                    line-height: 1.6;
                "
            >

                <h2>
                    Nhắc lịch phỏng vấn
                </h2>

                <p>
                    Xin chào
                    <strong>${fullName}</strong>,
                </p>

                <p>
                    Bạn có một buổi phỏng vấn
                    sắp diễn ra.
                </p>

                <hr>

                <p>
                    <strong>Công ty:</strong>
                    ${interview.company}
                </p>

                ${
                    interview.position
                        ? `
                            <p>
                                <strong>Vị trí:</strong>
                                ${interview.position}
                            </p>
                        `
                        : ""
                }

                <p>
                    <strong>Ngày:</strong>
                    ${formattedDate}
                </p>

                <p>
                    <strong>Thời gian:</strong>
                    ${interviewTime}
                </p>

                <p>
                    <strong>Hình thức:</strong>
                    ${
                        isOnline
                            ? "Trực tuyến"
                            : "Trực tiếp"
                    }
                </p>

                ${meetingInfo}

                ${
                    interview.note
                        ? `
                            <p>
                                <strong>Ghi chú:</strong>
                                ${interview.note}
                            </p>
                        `
                        : ""
                }

                <hr>

                <p>
                    Email này được gửi tự động
                    từ hệ thống CV Studio.
                </p>

            </div>

        `

    });

};