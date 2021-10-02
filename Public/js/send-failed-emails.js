document.addEventListener('DOMContentLoaded', () => {
    // Redirects the user to the url that will initiate the sending of emails.
    document.location.href = '/workshop/admin/google/send-failed-emails/start-send';

    // Loads the element containing the the text time into a variable.
    const timeElement = document.getElementById('timeRemaining');
    // Passes the text number into an integer.
    let time = parseInt(timeElement.textContent);
    // Defines a sub-function so that the code can be reused as a form of loop.
    const wait = () => {
        // Waits 1 second.
        setTimeout(()=> {
            // Tests if the timer has expired yet.
            if (time > 0) {
                // If the timer is still running, the time left is reduced by 1 second and shown on screen.
                time = time-1;
                timeElement.textContent = time;
                // The 'wait' function is called again.
                wait();
            }
        }, 1000);
    };
    // The wait function is called for the first time to initiate the whole process.
    wait();
});