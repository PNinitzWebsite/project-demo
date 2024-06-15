import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

function translateError(error) {
    const translations = {
        'Traceback': 'ตรวจสอบย้อนกลับ',
        'most':'','recent ':'','call ':'','last':'ตรวจสอบล่าสุด ',
        'File': 'ไฟล์',
        'line': 'บรรทัด',
        'in <module>': 'ใน <module>',
        'NameError': 'ชื่อที่ไม่รู้จัก',
        'SyntaxError': 'ข้อผิดพลาดทางไวยากรณ์',
        'IndentationError': 'ข้อผิดพลาดในการย่อหน้า',
        'TypeError': 'ข้อผิดพลาดของชนิดข้อมูล',
        'is not defined': 'ไม่ได้ถูกกำหนดค่า',
        'Did you mean': 'คุณหมายถึง',
        'Error': 'ข้อผิดพลาด',
        'name':'ชื่อ',
        'invalid syntax':'ไวยากรณ์ไม่ถูกต้อง',
        'Perhaps you forgot a comma':'บางทีคุณอาจลืมลูกน้ำ',
        'unexpected indent':'เยื้องที่ไม่คาดคิด',
        'command not found':'ไม่พบคำสั่ง'
    };

    for (const [key, value] of Object.entries(translations)) {
        error = error.replace(new RegExp(key, 'g'), value);
    }

    // แปลง Unicode เป็นภาษาไทย
    error = error.replace(/\\u([\d\w]{4})/gi, function (match, grp) {
        return String.fromCharCode(parseInt(grp, 16));
    });

    return error;
}

export default function handler(req, res) {
    if (req.method === 'POST') {
        const { code } = req.body;

        if (!code) {
            return res.status(200).json({ success: false, error: 'กรุณากรอกโค้ด' });
        }

        // สร้างไฟล์ชั่วคราวในไดเรกทอรีชั่วคราวของระบบ
        const tempFilePath = path.join(os.tmpdir(), 'temp.py');
        fs.writeFileSync(tempFilePath, code);

        // กำหนดเวลาสำหรับการรันโค้ด
        const timeout = 5000; // เวลา 5 วินาที

        // ใช้คำสั่ง python เพื่อรันไฟล์ชั่วคราวและตรวจสอบ syntax
        const process = exec(`python ${tempFilePath}`, (error, stdout, stderr) => {
            clearTimeout(timer);
            // ลบไฟล์ชั่วคราวหลังจากตรวจสอบเสร็จสิ้น
            fs.unlinkSync(tempFilePath);

            if (error) {
                // แปลงข้อความ error เป็นภาษาไทย และแยกบรรทัดที่ผิดพลาด
                const errorLines = stderr.split('\n');
                const syntaxErrorLine = errorLines.find(line => line.includes('File "'));
                let errorMessage = stderr.replace(tempFilePath, 'โค้ด').trim();
                errorMessage = translateError(errorMessage); // แปลงข้อความ error เป็นภาษาไทย

                if (syntaxErrorLine) {
                    const lineMatch = syntaxErrorLine.match(/line (\d+)/);
                    if (lineMatch) {
                        const lineNumber = lineMatch[1];
                        errorMessage = `โค้ดผิดพลาดที่บรรทัด ${lineNumber}: ${errorMessage}`;
                    }
                }
                res.status(200).json({ success: false, error: errorMessage });
            } else {
                res.status(200).json({ success: true, message: 'โค้ดถูกต้องตามไวยากรณ์', compiledResult: stdout.trim() });
            }
        });

        // กำหนดเวลาสำหรับ timeout
        const timer = setTimeout(() => {
            process.kill();
            // ส่งข้อความกลับไปว่าโค้ดไม่สามารถรันในเวลาที่กำหนด
            res.status(200).json({ success: false, error: 'โค้ดไม่สามารถรันในเวลาที่กำหนด' });
        }, timeout);
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
}
