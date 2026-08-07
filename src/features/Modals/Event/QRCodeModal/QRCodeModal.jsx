"use client";

import React, { useState, useEffect, useContext } from 'react';
import { X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
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
        // `{ message, attendanceToken }` at the top level — the shape both the
        // Express controller (markAttendance.js:99) and this port return. The
        // value is a signed JWT that expires in 20 minutes, not a record id, so
        // it is what has to be encoded into the QR image.
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
    <div className={style.qrContainer}>
      <div className={style.overlay} onClick={handleClose}></div>
      <div className={style.maindiv}>
        <div className={style.header}>
          <div
            onClick={handleClose}
            className={style.closebtn}
          >
            <X />
          </div>
          <div className={style.title}>Attendance QR Code</div>
        </div>
        
        <div className={style.content}>
          {isLoading ? (
            <div className={style.loadingContainer}>
              <div className={style.spinner}></div>
              <p>Generating QR Code...</p>
            </div>
          ) : error ? (
            <div className={style.errorContainer}>
              <p>{error}</p>
              <button onClick={handleRetry} className={style.retryBtn}>
                Try Again
              </button>
            </div>
          ) : qrCodeData ? (
            <div className={style.qrContent}>
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
              
              <div className={style.codeInfo}>
                <p className={style.instruction}>
                  Show this QR code to event organizers for attendance verification.
                </p>
                <p className={style.instruction}>
                This attendance QR code can be used only once. Do not share it with others.              </p>
              </div>
            </div>
          ) : (
            <div className={style.noCodeContainer}>
              <p>No attendance code available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;