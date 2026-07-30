"use client";

import React, { useState } from "react";
import styles from "../styles/TeamManagement.module.scss";

const ConfirmDialog = ({ isOpen, title, message, confirmText, onConfirm, onCancel }) => {
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.dialogOverlay} onClick={onCancel}>
            <div className={styles.dialogContent} onClick={(e) => e.stopPropagation()}>
                <h3 className={styles.dialogTitle}>{title}</h3>
                <p className={styles.dialogMessage}>{message}</p>
                <div className={styles.dialogActions}>
                    <button
                        className={styles.dialogCancel}
                        onClick={onCancel}
                        disabled={loading}
                    >
                        Stay
                    </button>
                    <button
                        className={styles.dialogConfirm}
                        onClick={handleConfirm}
                        disabled={loading}
                    >
                        {loading ? "Processing..." : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
