import { useState } from "react";
import { FileCheck2, Upload } from "lucide-react";
import { formatBytes } from "../../utils/formatBytes";

type FilePickerProps = {
    file: File | null;
    onChange: (file: File | null) => void;
    accept?: string;
    disabled?: boolean;
};

export default function FilePicker({ file, onChange, accept, disabled }: FilePickerProps) {
    const [dragging, setDragging] = useState(false);
    return (
        <label className={`file-picker${dragging ? " is-dragging" : ""}${file ? " has-file" : ""}`}
            onDragOver={event => { event.preventDefault(); if (!disabled) setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={event => {
                event.preventDefault(); setDragging(false);
                if (!disabled) onChange(event.dataTransfer.files[0] ?? null);
            }}>
            {file ? <FileCheck2 size={28} /> : <Upload size={28} />}
            <strong>{file ? file.name : "Drop a file here"}</strong>
            <span>{file ? `${formatBytes(file.size)} · Click to choose another file` : "or click to choose one from your device"}</span>
            <small>{accept ? ".SECURE FILE · ORIGINAL UP TO 32 MiB" : "DOCUMENT / PHOTO / ARCHIVE · UP TO 32 MiB"}</small>
            <input aria-label={accept ? "Choose a .secure file" : "Choose a file to encrypt"}
                type="file" accept={accept} disabled={disabled}
                onChange={event => { onChange(event.target.files?.[0] ?? null); event.target.value = ""; }} />
        </label>
    );
}
