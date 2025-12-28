import React, { useState, useEffect } from 'react';
import './VirtualMobile.css';

const VirtualMobile = ({ notification, parkedHours }) => {
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

  // Calculate Fee First (Before Rendering)
  // Default to 1 hour if 0 or undefined to avoid $0 issues
  const hoursToBill = parkedHours > 0 ? parkedHours : 1; 
  const finalFee = hoursToBill * 100; // $100 per hour

  const isPendingPayment = currentNotif.title === '停車繳費通知';
  const isPaymentSuccess = currentNotif.title === '繳費成功通知';

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
              <div className="notif-body">
                {isPendingPayment && (
                    /* Email List Item / Preview */
                    <div className="email-preview">
                        <div className="font-bold" style={{ fontWeight: 'bold', marginBottom: '4px' }}>youarebearpromax@gmail.com</div>
                        <div className="text-gray-600" style={{ color: '#4b5563' }}>
                            {/* Dynamic Fee in Subject/Preview */}
                            您有一筆待繳停車費 ${finalFee} 。請儘速繳納。
                        </div>
                    </div>
                )}

                {isPaymentSuccess && (
                    /* Email Body / Detail View */
                    <div className="email-body">
                        <div className="font-bold" style={{ fontWeight: 'bold', marginBottom: '4px' }}>youarebearpromax@gmail.com</div>
                        <div className="text-gray-600" style={{ color: '#4b5563' }}>
                           {/* Dynamic Fee in Body */}
                           您的停車費 ${finalFee} 已繳納成功。電子發票號碼：AB-{Math.floor(10000000 + Math.random() * 90000000)}
                        </div>
                    </div>
                )}

                {!isPendingPayment && !isPaymentSuccess && (
                    currentNotif.body
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualMobile;
