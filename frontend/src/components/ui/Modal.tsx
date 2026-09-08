import { useEffect, useRef, type ReactNode } from "react";

type ModalProps = {
    isOpen: boolean;
    title: string;
    children: ReactNode;
    onClose: () => void;
};

export default function Modal({ isOpen, title, children, onClose }: ModalProps) {
    const dialog = useRef<HTMLDialogElement>(null);
    useEffect(() => {
        const element = dialog.current;
        if (!element) return;
        const opener = document.activeElement;
        if (isOpen && !element.open) element.showModal();
        if (!isOpen && element.open) element.close();
        return () => {
            element.close();
            if (isOpen && opener instanceof HTMLElement && opener.isConnected) opener.focus();
        };
    }, [isOpen]);

    return (
        <dialog ref={dialog} className="modal-panel" aria-label={title}
            onCancel={event => { event.preventDefault(); onClose(); }}>
            <div className="modal-header">
                <h2>{title}</h2>
                <button className="modal-close" type="button" aria-label="Close dialog" onClick={onClose}>×</button>
            </div>
            <div className="modal-body">{isOpen && children}</div>
        </dialog>
    );
}
