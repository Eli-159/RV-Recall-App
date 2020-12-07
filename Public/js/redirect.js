const startRedirect = () => {
    console.log('redirecting...');
    const timeElement = document.getElementById('redirectTime');
    let time = parseInt(timeElement.textContent);
    const wait = () => {
        setTimeout(()=> {
            if (time > 0) {
                time = time-1;
                timeElement.textContent = time;
                console.log(time);
                wait();
            } else {
                document.getElementById('redirectAddress').click();
            }
        }, 1000);
    };
    wait();
};