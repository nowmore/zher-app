import { ref } from 'vue'
import JSZip from 'jszip';

const getZipName = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `files_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.zip`;
};

export function useFileTransfer(sendMessage) {
    const selectedFile = ref(null);
    const isZipping = ref(false);
    const zipProgress = ref(0);
    const currentZipName = ref('');
    const currentZipFile = ref('');
    const sharedFiles = new Map();

    const addSharedFile = (fileId, file) => {
        sharedFiles.set(fileId, file);
    };

    const handleStartUpload = async ({ fileId, transferId, offset = 0, end }, serverUrl) => {
        const file = sharedFiles.get(fileId);
        if (!file) return;

        try {
            let body = file;
            if (offset > 0 || (typeof end === 'number' && end < file.size - 1)) {
                const sliceEnd = (typeof end === 'number') ? end + 1 : file.size;
                body = file.slice(offset, sliceEnd);
            }

            const baseUrl = serverUrl.endsWith('/') ? serverUrl.slice(0, -1) : serverUrl;
            const uploadUrl = `${baseUrl}/api/upload/${transferId}`;
            
            await fetch(uploadUrl, {
                method: 'POST',
                body: body,
                headers: {
                    'Content-Type': 'application/octet-stream'
                }
            });
        } catch (err) {}
    };

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        if (files.length === 1) {
            selectedFile.value = files[0];
            sendMessage();
            e.target.value = '';
            return;
        }

        const zip = new JSZip();
        const zipName = getZipName();

        files.forEach(file => {
            zip.file(file.name, file);
        });

        isZipping.value = true;
        zipProgress.value = 0;
        currentZipName.value = zipName;

        try {
            const content = await zip.generateAsync({ type: "blob", compression: "STORE" }, (metadata) => {
                zipProgress.value = metadata.percent;
                currentZipFile.value = metadata.currentFile || '';
            });
            selectedFile.value = new File([content], zipName, { type: "application/zip" });
            sendMessage();
        } finally {
            isZipping.value = false;
        }

        e.target.value = '';
    };

    return {
        selectedFile,
        isZipping,
        zipProgress,
        currentZipName,
        currentZipFile,
        handleFileChange,
        handleStartUpload,
        addSharedFile
    };
}
