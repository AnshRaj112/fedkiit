"use client";

import React, { useState, useEffect, useContext } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import CloseButton from '../../../../components/CloseButton/CloseButton';
import AuthContext from '../../../../context/AuthContext';
import { RecoveryContext } from '../../../../context/RecoveryContext';
import { api } from '../../../../services';
import { Alert } from '../../../../microInteraction';
import style from './styles/QRCodeModal.module.scss';

const QRCodeModal = ({ onClose, eventId, onAttendanceMarked }) => {
  const [qrCodeData, setQrCodeData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const authCtx = useContext(AuthContext);
  const recoveryCtx = useContext(RecoveryContext);

  useEffect(() => {
    fetchAttendanceCode();
  }, [eventId]);

  useEffect(() => {
    if (onAttendanceMarked) {
      setAttendanceMarked(true);
    }
  }, [onAttendanceMarked]);

  const fetchAttendanceCode = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const teamCode = recoveryCtx.teamCode;
      
      let url = `/api/form/attendanceCode/${eventId}`;
      if (teamCode && teamCode.trim() !== '') {
        url += `?teamCode=${encodeURIComponent(teamCode)}`;
      }

      const token = localStorage.getItem('token');

      const response = await api.get(url, {
        headers: {
          'Authorization': token
        }
      });

      if (response.status === 200) {
        setQrCodeData(response.data.attendanceToken);
      } else {
        throw new Error('Failed to fetch attendance code');
      }
    } catch (error) {
      setError(error?.response?.data?.message || 'Failed to generate QR code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleRetry = () => {
    fetchAttendanceCode();
  };

  const handleAttendanceMarked = () => {
    setAttendanceMarked(true);
  };

  const handleOK = () => {
    onClose();
  };

  const handleScanNewAttendee = () => {
    setAttendanceMarked(false);
    setQrCodeData(null);
    fetchAttendanceCode();
  };

  return (
    <div
      className={style.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Attendance QR code"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className={style.panel}>
        <header className={style.header}>
          <h2 className={style.title}>Attendance QR code</h2>
          <CloseButton onClick={handleClose} label="Close QR code" />
        </header>

        <div className={style.content}>
          {isLoading ? (
            <div className={style.state}>
              <div className={style.spinner} aria-hidden="true" />
              <p className={style.stateText}>Generating QR code</p>
            </div>
          ) : error ? (
            <div className={style.state}>
              <p className={style.stateTitle}>Couldn&rsquo;t generate a code</p>
              <p className={style.stateText}>{error}</p>
              <button
                type="button"
                onClick={handleRetry}
                className={style.action}
              >
                Try again
              </button>
            </div>
          ) : qrCodeData ? (
            <>
              <div className={style.qrWrapper}>
                <QRCodeSVG
                  value={qrCodeData}
                  size={200}
                  level="M"
                  className={style.qrCode}
                  includeMargin={true}
                  fgColor="#000000"
                  bgColor="transparent"
                />
              </div>

              <p className={style.instruction}>
                Show this to an organiser to verify your attendance.
              </p>
              <p className={style.caution}>
                Single use - don&rsquo;t share it with anyone else.
              </p>
            </>
          ) : (
            <div className={style.state}>
              <p className={style.stateTitle}>No attendance code yet</p>
              <p className={style.stateText}>
                A code appears here once attendance opens for this event.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;