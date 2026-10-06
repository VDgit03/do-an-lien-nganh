import {
    sendInterviewReminders
} from "./reminderService.js";

const runReminderCheck = async () => {

    try {

        await sendInterviewReminders();

    } catch (error) {

        console.error(
            "REMINDER SCHEDULER ERROR:",
            error
        );

    }

};

export const startInterviewReminderScheduler = () => {

    console.log(
        "Interview reminder scheduler started."
    );


    runReminderCheck();

    setInterval(
        runReminderCheck,
        30 * 1000
    );

};