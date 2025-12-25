import React, { useState, useEffect } from 'react';
import './VirtualMobile.css';

const VirtualMobile = ({ notification }) => {
  const [visible, setVisible] = useState(false);
  const [currentNotif, setCurrentNotif] = useState(null);

  useEffect(() => {
    if (notification) {
      setCurrentNotif(notification);
      setVisible(true);
      
      // Auto hide after 8 seconds
      const timer = setTimeout(() => {
        setVisible(false);
      }, 8000);
      
      return () => clearTimeout(timer);
    }
  }, [notification]);

  if (!visible || !currentNotif) return null;

  return (
    <div className="virtual-mobile-container">
      <div className="mobile-frame">
        <div className="mobile-notch"></div>
        <div className="mobile-screen">
          <div className="notification-banner slide-in">
            <div className="notif-header">
              <span className="app-icon">✉️</span>
              <span className="app-name">Gmail</span>
              <span className="time">現在</span>
            </div>
            <div className="notif-content">
              <div className="notif-title">{currentNotif.title}</div>
              <div className="notif-body">{currentNotif.body}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualMobile;
