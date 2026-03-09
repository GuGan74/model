import React, { useRef } from 'react';

export default function OTPInput({ onComplete, darkMode = false }) {
    const refs = useRef([]);

    function handleInput(e, idx) {
        const val = e.target.value.replace(/[^0-9]/g, '');
        e.target.value = val;
        e.target.classList.toggle('filled', val.length > 0);

        if (val && idx < 5) {
            refs.current[idx + 1]?.focus();
        }

        // Check if all filled
        const allVals = refs.current.map(r => r?.value || '');
        if (allVals.every(v => v.length === 1)) {
            onComplete?.(allVals.join(''));
        }
    }

    function handleKeyDown(e, idx) {
        if (e.key === 'Backspace' && !e.target.value && idx > 0) {
            refs.current[idx - 1]?.focus();
        }
    }

    function handlePaste(e) {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
        pasted.split('').forEach((ch, i) => {
            if (refs.current[i]) {
                refs.current[i].value = ch;
                refs.current[i].classList.add('filled');
            }
        });
        if (pasted.length === 6) {
            onComplete?.(pasted);
            refs.current[5]?.focus();
        } else {
            refs.current[Math.min(pasted.length, 5)]?.focus();
        }
    }

    const boxStyle = darkMode ? {
        background: 'rgba(255,255,255,.1)',
        borderColor: 'rgba(255,255,255,.3)',
        color: 'white',
    } : {};

    return (
        <div className="otp-row">
            {Array.from({ length: 6 }).map((_, i) => (
                <input
                    key={i}
                    ref={el => refs.current[i] = el}
                    className="otp-box"
                    type="tel"
                    maxLength={1}
                    style={boxStyle}
                    onInput={e => handleInput(e, i)}
                    onKeyDown={e => handleKeyDown(e, i)}
                    onPaste={handlePaste}
                    autoFocus={i === 0}
                />
            ))}
        </div>
    );
}
