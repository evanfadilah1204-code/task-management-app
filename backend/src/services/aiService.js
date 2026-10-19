"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processAIChat = processAIChat;
const generative_ai_1 = require("@google/generative-ai");
const Todo_1 = __importDefault(require("../models/Todo"));
const Habit_1 = __importDefault(require("../models/Habit"));
const TimeBlock_1 = __importDefault(require("../models/TimeBlock"));
const Expense_1 = __importDefault(require("../models/Expense"));
// Definisi Tools (Function Calling) untuk Gemini API
const addTodoDeclaration = {
    name: 'add_todo',
    description: 'Menambahkan tugas baru (Todo Task) ke dalam database pilar 1.',
    parameters: {
        type: generative_ai_1.SchemaType.OBJECT,
        properties: {
            taskName: { type: generative_ai_1.SchemaType.STRING, description: 'Nama tugas / pekerjaan yang harus dilakukan' },
            subject: { type: generative_ai_1.SchemaType.STRING, description: 'Nama mata kuliah, projek, atau kategori tugas' },
            deadline: { type: generative_ai_1.SchemaType.STRING, description: 'Format tanggal YYYY-MM-DD atau ISO string deadline' }
        },
        required: ['taskName']
    }
};
const addHabitDeclaration = {
    name: 'add_habit',
    description: 'Menambahkan habit / kebiasaan positif baru (Daily/Weekly) ke database pilar 2.',
    parameters: {
        type: generative_ai_1.SchemaType.OBJECT,
        properties: {
            name: { type: generative_ai_1.SchemaType.STRING, description: 'Nama kebiasaan positif (contoh: Minum Air 2 Liter, Olahraga 30 Menit)' },
            frequency: { type: generative_ai_1.SchemaType.STRING, description: 'Frekuensi habit: "daily" (harian) atau "weekly" (mingguan)' }
        },
        required: ['name']
    }
};
const addExpenseDeclaration = {
    name: 'add_expense',
    description: 'Menambahkan pencatatan pengeluaran uang (Expense) baru ke database pilar 4.',
    parameters: {
        type: generative_ai_1.SchemaType.OBJECT,
        properties: {
            amount: { type: generative_ai_1.SchemaType.NUMBER, description: 'Nominal uang yang dikeluarkan dalam Rupiah (tanpa titik)' },
            category: { type: generative_ai_1.SchemaType.STRING, description: 'Kategori pengeluaran (contoh: Makanan, Transport, Belanja, Hiburan, Kos, Umum)' },
            notes: { type: generative_ai_1.SchemaType.STRING, description: 'Catatan tambahan mengenai pengeluaran' }
        },
        required: ['amount']
    }
};
const addTimeBlockDeclaration = {
    name: 'add_timeblock',
    description: 'Menambahkan alokasi jam/jadwal kegiatan (TimeBlock) baru ke database pilar 3.',
    parameters: {
        type: generative_ai_1.SchemaType.OBJECT,
        properties: {
            title: { type: generative_ai_1.SchemaType.STRING, description: 'Nama kegiatan / judul time block' },
            startTime: { type: generative_ai_1.SchemaType.STRING, description: 'Jam mulai dalam format HH:mm (contoh: 09:00 atau 19:30)' },
            endTime: { type: generative_ai_1.SchemaType.STRING, description: 'Jam selesai dalam format HH:mm (contoh: 11:00 atau 21:00)' },
            category: { type: generative_ai_1.SchemaType.STRING, description: 'Kategori kegiatan (contoh: Belajar, Coding, Istirahat, Olahraga, Umum)' }
        },
        required: ['title', 'startTime', 'endTime']
    }
};
// Smart Resilient Engine: Prioritas Intent yang Sangat Akurat & Presisi
function processSmartFallback(userId, userPrompt, todos, habits, timeblocks, expenses) {
    return __awaiter(this, void 0, void 0, function* () {
        const textLower = userPrompt.toLowerCase();
        let actionExecuted = false;
        let reply = '';
        const completedTodos = todos.filter(t => Boolean(t.isCompleted)).length;
        const completedHabits = habits.filter(h => Boolean(h.checkedInToday)).length;
        const completedTimeBlocks = timeblocks.filter(tb => Boolean(tb.isCompleted)).length;
        const totalExpenses = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
        // Default Rekap Summary
        const defaultSummaryReply = `🤖 **FeloAssistant Smart Summary**:

📊 **Rekap Status 4 Pilar Kamu Saat Ini**:
- 📝 **Tugas (Todo)**: ${completedTodos} dari ${todos.length} selesai.
- ⚡ **Habit Tracker**: ${completedHabits} dari ${habits.length} check-in hari ini.
- ⏰ **TimeBlock**: ${completedTimeBlocks} dari ${timeblocks.length} selesai.
- 💰 **Pengeluaran**: Rp ${totalExpenses.toLocaleString('id-ID')}

💡 *Tips*: Kamu bisa ketik *"Tolong buatkan habit harian Minum Air 2 Liter"*, *"Catat pengeluaran beli makan 25000"*, atau *"Meeting jam 4 sore"*.`;
        // 0. JIKA PERMOHONAN REKAP / SUMMARY / STATS -> LANGSUNG KEMBALIKAN SUMMARY (JANGAN BUAT TASK DUMMY!)
        const isSummaryIntent = /\b(?:rekap|summary|analisis|skor|laporan|evaluasi|status|dashboard)\b/i.test(textLower);
        if (isSummaryIntent) {
            return { reply: defaultSummaryReply, actionExecuted: false };
        }
        // Kata kunci penentu intent dengan Word Boundaries \b yang presisi
        const hasHabitKeywords = /\b(?:habit|kebiasaan|rutin|rutinitas|membiasakan)\b/i.test(textLower);
        const hasTimeKeywords = /\b(?:jam|meeting|jadwal|timeblock|pukul|acara|agenda)\b/i.test(textLower);
        const hasExpenseKeywords = /\b(?:pengeluaran|beli|bayar|rp|rupiah|biaya|ongkos|harga|belanja)\b/i.test(textLower) || /\d+\s*(?:rb|k|ribu)\b/i.test(textLower);
        const hasTodoKeywords = /\b(?:tugas|kuis|pr|deadline|matkul|ingetin|ingatkan|todo)\b/i.test(textLower);
        // 1. INTENT HABIT TRACKER (Pilar 2 Kebiasaan)
        if (hasHabitKeywords) {
            let frequency = textLower.includes('mingguan') || textLower.includes('weekly') ? 'weekly' : 'daily';
            let habitName = userPrompt
                .replace(/["']/g, '')
                .replace(/\b(?:tolong|tambah|tambahkan|buat|buatkan|habit|kebiasaan|harian|mingguan|daily|weekly|catat)\b/ig, '')
                .replace(/\s+/g, ' ')
                .trim();
            if (!habitName)
                habitName = 'Kebiasaan Baru';
            yield Habit_1.default.create({
                userId,
                name: habitName,
                frequency,
                streak: 0,
                checkedInToday: false
            });
            actionExecuted = true;
            reply = `✅ **Berhasil ditambahkan ke Pilar 2 (Habit Tracker)!**\n\n- **Nama Kebiasaan**: "${habitName}"\n- **Frekuensi**: ${frequency === 'daily' ? 'Harian (Daily)' : 'Mingguan (Weekly)'}\n- **Streak awal**: 0 Hari\n\n*Habit ini sudah otomatis tampil di Dashboard kamu!*`;
            return { reply, actionExecuted };
        }
        // 2. INTENT TIMEBLOCK (Jadwal Jam)
        if (hasTimeKeywords) {
            const timeMatch = textLower.match(/(\d{1,2})[:.]?(\d{2})?\s*(pagi|siang|sore|malam)?/i);
            let startTime = '16:00';
            let endTime = '17:00';
            if (timeMatch) {
                let hour = parseInt(timeMatch[1]);
                const ampm = timeMatch[3];
                if (ampm === 'sore' && hour < 12)
                    hour += 12;
                if (ampm === 'malam' && hour < 12)
                    hour += 12;
                if (ampm === 'siang' && hour < 12 && hour !== 12)
                    hour += 12;
                const formattedStart = `${hour.toString().padStart(2, '0')}:00`;
                const formattedEnd = `${(hour + 1).toString().padStart(2, '0')}:00`;
                startTime = formattedStart;
                endTime = formattedEnd;
            }
            const title = userPrompt.replace(/\b(?:tambah|buat|jadwalkan|jadwal|timeblock|catat)\b/ig, '').trim();
            yield TimeBlock_1.default.create({
                userId,
                title: title || 'Kegiatan / Meeting Baru',
                startTime,
                endTime,
                category: 'Umum',
                isCompleted: false
            });
            actionExecuted = true;
            reply = `✅ **Berhasil ditambahkan ke Pilar TimeBlock (Jadwal)!**\n\n- **Kegiatan**: ${title || 'Meeting'}\n- **Waktu**: ${startTime} - ${endTime}\n- **Kategori**: Umum`;
            return { reply, actionExecuted };
        }
        // 3. INTENT TODO (Tugas / Pekerjaan)
        if (hasTodoKeywords) {
            const taskName = userPrompt.replace(/\b(?:tambah|buat|ingetin|ingatkan|tugas|todo|catat)\b/ig, '').trim();
            yield Todo_1.default.create({
                userId,
                taskName: taskName || 'Tugas Baru',
                subject: 'Umum',
                deadline: new Date(Date.now() + 86400000),
                isCompleted: false
            });
            actionExecuted = true;
            reply = `✅ **Berhasil ditambahkan ke Pilar 1 (Tugas)!**\n\n- **Nama Tugas**: ${taskName || 'Tugas Baru'}\n- **Deadline**: Besok\n- **Status**: Belum Selesai`;
            return { reply, actionExecuted };
        }
        // 4. INTENT EXPENSE (Pengeluaran Keuangan)
        if (hasExpenseKeywords) {
            const expenseNominalMatch = userPrompt.match(/(?:rp\.?|rp\s*)?(\d+(?:[\.\,]\d+)*)\s*(rb|k|ribu)?/i);
            if (expenseNominalMatch) {
                let rawAmount = expenseNominalMatch[1].replace(/[\.\,]/g, '');
                let multiplier = 1;
                const unit = (expenseNominalMatch[2] || '').toLowerCase();
                if (unit === 'rb' || unit === 'ribu' || unit === 'k')
                    multiplier = 1000;
                let amount = Number(rawAmount) * multiplier;
                if (!isNaN(amount) && amount > 0) {
                    let category = 'Makanan';
                    if (/(?:bensin|gojek|grab|angkot|transitan|bensin|tol)/i.test(textLower))
                        category = 'Transport';
                    else if (/(?:kos|listrik|wifi|pulsa|air|tagihan)/i.test(textLower))
                        category = 'Tagihan';
                    else if (/(?:baju|sepatu|belanja|online|shopee|tokopedia)/i.test(textLower))
                        category = 'Belanja';
                    yield Expense_1.default.create({
                        userId,
                        amount,
                        category,
                        notes: userPrompt,
                        date: new Date().toISOString().split('T')[0]
                    });
                    actionExecuted = true;
                    reply = `✅ **Berhasil dicatat ke Pilar Keuangan!**\n\n- **Nominal**: Rp ${amount.toLocaleString('id-ID')}\n- **Kategori**: ${category}\n- **Catatan**: ${userPrompt}\n\n*Total pengeluaran kamu saat ini menjadi Rp ${(totalExpenses + amount).toLocaleString('id-ID')}.*`;
                    return { reply, actionExecuted };
                }
            }
        }
        return { reply: defaultSummaryReply, actionExecuted: false };
    });
}
function processAIChat(userId_1, userPrompt_1) {
    return __awaiter(this, arguments, void 0, function* (userId, userPrompt, history = []) {
        const [todos, habits, timeblocks, expenses] = yield Promise.all([
            Todo_1.default.find({ userId }).sort({ createdAt: -1 }),
            Habit_1.default.find({ userId }).sort({ createdAt: -1 }),
            TimeBlock_1.default.find({ userId }).sort({ createdAt: -1 }),
            Expense_1.default.find({ userId }).sort({ date: -1 })
        ]);
        // JIKA PROMPT PENGGUNA TERMASUK INPUT TUGAS / HABIT / TIMEBLOCK / EXPENSE / REKAP, JALANKAN ACTION PARSER DULU
        const actionCheck = yield processSmartFallback(userId, userPrompt, todos, habits, timeblocks, expenses);
        if (actionCheck.actionExecuted || /\b(?:rekap|summary|analisis|skor|laporan|evaluasi|status|dashboard)\b/i.test(userPrompt)) {
            return actionCheck;
        }
        const completedTodos = todos.filter(t => Boolean(t.isCompleted)).length;
        const completedHabits = habits.filter(h => Boolean(h.checkedInToday)).length;
        const completedTimeBlocks = timeblocks.filter(tb => Boolean(tb.isCompleted)).length;
        const totalExpenses = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
        const contextSummary = `
=== SINKRONISASI DATA USER SAAT INI (REALTIME MONGO DB) ===
Tanggal & Jam Server: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}

--- PILAR 1: TUGAS / TODO (${completedTodos}/${todos.length} Selesai) ---
${todos.length === 0 ? '- Belum ada tugas.' : todos.map(t => `- [${t.isCompleted ? 'SELESAI' : 'BELUM'}] ${t.taskName} (Matkul: ${t.subject || 'Umum'}, Deadline: ${new Date(t.deadline).toLocaleDateString('id-ID')})`).join('\n')}

--- PILAR 2: KEBIASAAN / HABIT TRACKER (${completedHabits}/${habits.length} Check-in Hari Ini) ---
${habits.length === 0 ? '- Belum ada habit.' : habits.map(h => `- [${h.checkedInToday ? 'CHECKED-IN' : 'BELUM'}] ${h.name} (Streak: ${h.streak} hari, Freq: ${h.frequency})`).join('\n')}

--- PILAR 3: JADWAL JAM / TIMEBLOCK (${completedTimeBlocks}/${timeblocks.length} Selesai) ---
${timeblocks.length === 0 ? '- Belum ada jadwal.' : timeblocks.map(tb => `- [${tb.isCompleted ? 'SELESAI' : 'BELUM'}] ${tb.title} (${tb.startTime} - ${tb.endTime}, Kat: ${tb.category})`).join('\n')}

--- PILAR 4: KEUANGAN / EXPENSE (Total Pengeluaran: Rp ${totalExpenses.toLocaleString('id-ID')}) ---
${expenses.length === 0 ? '- Belum ada catatan pengeluaran.' : expenses.map(e => `- Rp ${e.amount.toLocaleString('id-ID')} | Kategori: ${e.category} | Catatan: ${e.notes || '-'} | Tanggal: ${e.date}`).join('\n')}
===========================================================
`;
        const systemInstruction = `
Kamu adalah FeloAssistant AI, asisten produktivitas personal pintar berorientasi hasil yang terintegrasi langsung dengan database MERN Stack pengguna.
Tugas utama kamu:
1. Membantu pengguna mengelola 4 Pilar Produktivitas (Tugas, Habit, Timeblock, Keuangan).
2. Memberikan saran produktivitas, analisis waktu, tips belajar, dan audit pengeluaran yang ramah, ringkas, dan memotivasi.
3. Menggunakan fitur TOOL CALLING (add_todo, add_habit, add_expense, add_timeblock) jika pengguna meminta kamu untuk mencatat/menambahkan data baru.
4. Gunakan bahasa Indonesia yang ramah, sopan, komunikatif, dan responsif.
`;
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey === 'your_gemini_api_key_here') {
            return actionCheck;
        }
        const candidateModels = ['gemini-3.7-flash', 'gemini-flash-latest', 'gemini-3.5-flash-lite'];
        const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        for (const modelName of candidateModels) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: systemInstruction,
                    tools: [{ functionDeclarations: [addTodoDeclaration, addHabitDeclaration, addExpenseDeclaration, addTimeBlockDeclaration] }]
                });
                const chatSession = model.startChat({
                    history: [
                        {
                            role: 'user',
                            parts: [{ text: `System context update:\n${contextSummary}` }]
                        },
                        {
                            role: 'model',
                            parts: [{ text: 'Siap! Saya telah membaca seluruh data 4 pilar produktivitas kamu. Ada yang bisa saya bantu hari ini?' }]
                        },
                        ...history
                    ]
                });
                const result = yield chatSession.sendMessage(userPrompt);
                const response = result.response;
                const functionCalls = response.functionCalls();
                let actionExecuted = false;
                let actionMessage = '';
                if (functionCalls && functionCalls.length > 0) {
                    for (const call of functionCalls) {
                        const { name, args } = call;
                        if (name === 'add_todo') {
                            const { taskName, subject, deadline } = args;
                            const dlDate = deadline ? new Date(deadline) : new Date(Date.now() + 86400000);
                            yield Todo_1.default.create({
                                userId,
                                taskName: taskName || 'Tugas Baru',
                                subject: subject || 'Umum',
                                deadline: isNaN(dlDate.getTime()) ? new Date() : dlDate,
                                isCompleted: false
                            });
                            actionExecuted = true;
                            actionMessage += `\n\n✅ *Berhasil menambahkan Tugas baru:* "${taskName}" di Pilar 1!`;
                        }
                        else if (name === 'add_habit') {
                            const { name: habitName, frequency } = args;
                            yield Habit_1.default.create({
                                userId,
                                name: habitName || 'Kebiasaan Baru',
                                frequency: frequency === 'weekly' ? 'weekly' : 'daily',
                                streak: 0,
                                checkedInToday: false
                            });
                            actionExecuted = true;
                            actionMessage += `\n\n✅ *Berhasil membuat Habit baru:* "${habitName}" (${frequency === 'weekly' ? 'Mingguan' : 'Harian'}) di Pilar 2!`;
                        }
                        else if (name === 'add_expense') {
                            const { amount, category, notes } = args;
                            yield Expense_1.default.create({
                                userId,
                                amount: Number(amount) || 0,
                                category: category || 'Makanan',
                                notes: notes || 'Input via Felo AI',
                                date: new Date().toISOString().split('T')[0]
                            });
                            actionExecuted = true;
                            actionMessage += `\n\n✅ *Berhasil mencatat Pengeluaran:* Rp ${Number(amount).toLocaleString('id-ID')} (${category || 'Makanan'}) di Pilar 4!`;
                        }
                        else if (name === 'add_timeblock') {
                            const { title, startTime, endTime, category } = args;
                            yield TimeBlock_1.default.create({
                                userId,
                                title: title || 'Jadwal Baru',
                                startTime: startTime || '09:00',
                                endTime: endTime || '10:00',
                                category: category || 'Umum',
                                isCompleted: false
                            });
                            actionExecuted = true;
                            actionMessage += `\n\n✅ *Berhasil membuat Jadwal TimeBlock:* "${title}" (${startTime} - ${endTime}) di Pilar 3!`;
                        }
                    }
                }
                let responseText = response.text() || '';
                if (actionMessage) {
                    responseText += actionMessage;
                }
                return {
                    reply: responseText || 'Maaf, saya tidak dapat memproses tanggapan.',
                    actionExecuted
                };
            }
            catch (modelErr) {
                console.warn(`⚠️ Model ${modelName} warning:`, modelErr.message);
                // continue to next model candidate
            }
        }
        // Jika semua kandidat model gagal, fallback ke engine lokal
        return actionCheck;
    });
}
