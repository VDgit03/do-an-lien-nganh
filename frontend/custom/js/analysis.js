document.addEventListener(
    "DOMContentLoaded",
    async () => {
        await loadSidebarStats();
        initAnalysis();
    }
);


/* init */
function initAnalysis() {
    const cvFile = document.getElementById("cvFile");

    const uploadBox = document.getElementById("uploadBox");

    const removeFile = document.getElementById("removeFile");

    const jobDescription = document.getElementById("jobDescription");

    const sampleJdBtn = document.getElementById("sampleJdBtn");

    const clearBtn = document.getElementById("clearBtn");

    const analyzeBtn = document.getElementById("analyzeBtn");

    /* chọn file */
    cvFile.addEventListener(
        "change",
        () => {
            if (!cvFile.files.length) {
                return;
            }

            handleFile(cvFile.files[0]);
        }
    );

    /* kéo file */
    uploadBox.addEventListener(
        "dragover",
        (event) => {
            event.preventDefault();

            uploadBox.classList.add(
                "dragging"
            );
        }
    );

    /* rời khỏi khu vực drop */
    uploadBox.addEventListener(
        "dragleave",
        () => {
            uploadBox.classList.remove(
                "dragging"
            );
        }
    );

    /* thả file */
    uploadBox.addEventListener(
        "drop",
        (event) => {
            event.preventDefault();

            uploadBox.classList.remove(
                "dragging"
            );

            const file =
                event.dataTransfer.files[0];

            if (!file) {
                return;
            }

            handleFile(file);
        }
    );

    /* xóa file */
    removeFile.addEventListener(
        "click",
        (event) => {
            event.preventDefault();

            removeSelectedFile();
        }
    );

    /* đếm ký tự jd */

    jobDescription.addEventListener(
        "input",
        updateCharacterCount
    );

    /* jd mẫu */

    sampleJdBtn.addEventListener(
        "click",
        useSampleJD
    );

    /* xóa nội dung */

    clearBtn.addEventListener(
        "click",
        clearAnalysis
    );

    /* phân tích */

    analyzeBtn.addEventListener(
        "click",
        analyzeCV
    );
}


/* xử lý file */
function handleFile(file) {
    const fileInfo = document.getElementById("fileInfo");

    const fileName = document.getElementById("fileName");

    const fileSize = document.getElementById("fileSize");

    const uploadTitle = document.getElementById("uploadTitle");

    const cvFile = document.getElementById("cvFile");

    /* chỉ nhận pdf */
    if (file.type !== "application/pdf") {
        showMessage(
            "Vui lòng chọn file PDF."
        );

        return;
    }

    /* tối đa 10mb */
    if (file.size > 10 * 1024 * 1024) {
        showMessage(
            "File PDF không được vượt quá 10MB."
        );

        return;
    }

    /* gán file vào input */
    const dataTransfer = new DataTransfer();

    dataTransfer.items.add(file);

    cvFile.files = dataTransfer.files;

    /* hiển thị thông tin */
    fileName.textContent = file.name;

    fileSize.textContent = formatFileSize(file.size);

    uploadTitle.textContent = "Đã chọn file CV";

    fileInfo.classList.add(
        "show"
    );
}


/* xóa file */
function removeSelectedFile() {
    const cvFile = document.getElementById("cvFile");

    const fileInfo = document.getElementById("fileInfo");

    const uploadTitle = document.getElementById("uploadTitle");

    cvFile.value = "";

    fileInfo.classList.remove(
        "show"
    );

    uploadTitle.textContent = "Nhấn để chọn tệp CV (PDF)";
}


/* format dung lượng file */
function formatFileSize(bytes) {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(
            bytes / 1024
        ).toFixed(1)} KB`;
    }

    return `${(
        bytes /
        1024 /
        1024
    ).toFixed(1)} MB`;
}


/* đếm ký tự */
function updateCharacterCount() {
    const jobDescription = document.getElementById(
        "jobDescription"
    );

    const charCount = document.getElementById(
        "charCount"
    );

    charCount.textContent = `${jobDescription.value.length} ký tự`;
}


/* jd mẫu */
function useSampleJD() {
    const jobDescription = document.getElementById(
        "jobDescription"
    );

    const sampleJD = `
        Frontend Developer - Junior

        Mô tả công việc:

        - Phát triển và bảo trì giao diện website.
        - Xây dựng giao diện bằng HTML, CSS và JavaScript.
        - Làm việc với React.js.
        - Kết nối và sử dụng REST API.
        - Tối ưu giao diện trên nhiều thiết bị.
        - Phối hợp với Backend Developer và UI/UX Designer.

        Yêu cầu:

        - Có kiến thức về HTML, CSS, JavaScript.
        - Có kiến thức về React.js.
        - Hiểu cơ bản về REST API.
        - Biết sử dụng Git/GitHub.
        - Có khả năng làm việc nhóm.
        - Có tư duy logic và giải quyết vấn đề.
    `.trim();

    jobDescription.value = sampleJD;

    updateCharacterCount();
}


/* xóa toàn bộ nội dung */
function clearAnalysis() {
    const jobDescription = document.getElementById(
        "jobDescription"
    );

    const cvFile = document.getElementById(
        "cvFile"
    );

    const fileInfo = document.getElementById(
        "fileInfo"
    );

    const uploadTitle = document.getElementById(
        "uploadTitle"
    );

    /* xóa file */
    cvFile.value = "";

    fileInfo.classList.remove(
        "show"
    );

    uploadTitle.textContent =
        "Nhấn để chọn tệp CV (PDF)";

    /* xóa jd */
    jobDescription.value = "";

    /* reset số ký tự */
    updateCharacterCount();
}


/* phân tích cv */
function analyzeCV() {
    const cvFile = document.getElementById(
        "cvFile"
    );

    const jobDescription = document.getElementById(
        "jobDescription"
    );

    const level = document.getElementById(
        "level"
    );

    const jobField = document.getElementById(
        "jobField"
    );

    /* kiểm tra cv */
    if (!cvFile.files.length) {
        showMessage(
            "Vui lòng tải CV dạng PDF."
        );

        return;
    }

    /* kiểm tra jd */
    if (!jobDescription.value.trim()) {
        showMessage(
            "Vui lòng nhập nội dung JD."
        );

        jobDescription.focus();

        return;
    }

    /* lấy dữ liệu */

    const file = cvFile.files[0];

    const selectedLevel = level.value;

    const selectedField = jobField.value;

    console.log(
        "CV:",
        file
    );

    console.log(
        "JD:",
        jobDescription.value
    );

    console.log(
        "Cấp bậc:",
        selectedLevel
    );

    console.log(
        "Ngành:",
        selectedField
    );

    showMessage(
        "Đã nhận thông tin. Chức năng phân tích sẽ kết nối với API sau."
    );
}


/* thông báo */
function showMessage(message) {
    const toastArea = document.getElementById(
        "toastArea"
    );

    if (!toastArea) {
        alert(message);
        return;
    }

    const toast = document.createElement(
        "div"
    );

    toast.className = "analysis-toast";

    toast.textContent = message;

    toastArea.appendChild(
        toast
    );

    setTimeout(
        () => {
            toast.classList.add(
                "hide"
            );

            setTimeout(
                () => {
                    toast.remove();
                },
                300
            );
        },
        2500
    );
}