let filePaths = [];  // 임시 파일목록 저장

// 기본 저장경로 세팅
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    initializeApp();

    document.getElementById('result-zone').addEventListener('click', function(event) {
        // Check if the clicked element has the class 'result-link'
        if (event.target.classList.contains('result-link')) {
            event.preventDefault();  // Prevent default anchor behavior
            const filePath = event.target.getAttribute('data-filepath');
            showInFolder(filePath);
        }
    });
});

// 기본 저장 경로 가져오기
document.getElementById('open-dialog-btn').addEventListener('click', openDirectoryDialog);

// 변환버튼 클릭
document.getElementById('process-button').addEventListener('click', () => {
    filePaths.forEach(file => {
        convertAndSaveFile(file.path, file.name);  // 각 파일을 처리
    });
});

// drop zone 드래그 & 드랍 이벤트 
document.getElementById('drop-zone').ondragover = (event) => {
    event.preventDefault();
};

// drop zone 드래그 & 드랍 이벤트 
document.getElementById('drop-zone').ondrop = (event) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    processFiles(files);
};



async function initializeApp() {
    try {
        const desktopPath = await window.electronAPI.getDesktopPath();
        document.getElementById('save-path').value = desktopPath;
        window.savePath = desktopPath;
    } catch (error) {
        console.error('Failed to load desktop path:', error);
    }

    document.getElementById('open-dialog-btn').addEventListener('click', openDirectoryDialog);
}


// Drop Zone 에 파일 드래그 & 드랍 하면 리스트업 하는 함수
function processFiles(files) {
    const fileList = document.getElementById('drop-zone');
    const dropZoneText = document.getElementById('drop-zone-text');

    if (files.length > 0) {
        dropZoneText.style.display = 'none';  // 워터마크 텍스트 숨기기
    }
    Array.from(files).forEach(file => {
        const originalFileName = file.name;  // 정규화 처리를 하지 않고 원본 파일명 사용
        const filePath = file.path;

        console.log("Type of file.name and file.path in processfiles ", typeof(file.name), typeof(file.path));

        // 파일이 이미 리스트에 없는지 확인
        if (!filePaths.some(f => f.name === originalFileName)) {
            filePaths.push({path: filePath, name: originalFileName});  // 파일 경로와 이름 저장
            const listItem = document.createElement('div');
            listItem.textContent = originalFileName;  // 리스트에 원본 파일명 표시
            fileList.appendChild(listItem);
        }
    });
}


// 버튼 누르면 자/소 분리가 된 파일들을 일괄 처리 
async function convertAndSaveFile(filePath, fileName) {
    try {
        // 파일 이름 정규화 (NFC)
        const normalizedFileName = fileName.normalize('NFC');
        // 새로운 파일 이름 생성: 원래 이름에 "_." 추가
        const newFileName = normalizedFileName.replace(/\.[^/.]+$/, "") + "_." + normalizedFileName.split('.').pop();
        // IPC를 통해 새 파일 경로 생성
        const newFilePath = await window.electronAPI.joinPath(window.savePath, newFileName);
        // 파일 복사: 원본 파일의 내용 그대로 새로운 파일 경로로 복사
        await window.electronAPI.copyFile(filePath, newFilePath);
        console.log('File saved:', newFilePath);

        // Updating Result Zone
        const resultZone = document.getElementById('result-zone');
        const resultEntry = document.createElement('div');
        resultEntry.className = 'result-entry'; // Apply class for specific styling
        resultEntry.innerHTML = `<span> 변환된 파일: <a href="#" class="result-link" data-filepath="${newFilePath}">${newFileName}</a></span>`;
        resultZone.appendChild(resultEntry);

    } catch (err) {
        console.error('Error processing file:', err);
    }
}

// 완료된 파일의 위치를 탐색기에서 보여주는 함수
function showInFolder(filePath) {
    console.log("show in Folder called : ", filePath);
    window.electronAPI.send('show-in-folder', filePath);
}



// 저장경로 다이얼로그
function openDirectoryDialog() {
    window.electronAPI.openDirectoryDialog().then((selectedPath) => {
        if (selectedPath) {
            document.getElementById('save-path').value = selectedPath;
            window.savePath = selectedPath; // Update the path globally
        }
    }).catch(error => {
        console.error('Directory selection error:', error);
    });
}

