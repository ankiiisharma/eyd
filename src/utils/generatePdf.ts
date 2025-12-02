import jsPDF from "jspdf";

interface Note {
    note: string;
    createdAt: string;
    counsellor: string;
}

interface AppointmentData {
    appointment_id: string;
    appointment_date: string;
    slot_time: string;
    client_name: string;
    client_email: string;
    client_phone: string;
    consultation_reason: string;
    notes: string;
}

export const generateAppointmentNotesPDF = async (
    appointmentData: AppointmentData,
    notes: Note[],
    filteredNotes: Note[]
) => {
    const doc = new jsPDF();
    let y = 30;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;

    // Add Logo
    try {
        const logoResponse = await fetch('/Emotionally Yours Logo.png');
        const logoBlob = await logoResponse.blob();
        const logoUrl = URL.createObjectURL(logoBlob);

        const img = new Image();
        img.src = logoUrl;
        await new Promise((resolve) => {
            img.onload = () => {
                const logoWidth = 60;
                const logoHeight = (img.height * logoWidth) / img.width;
                doc.addImage(img, 'PNG', margin, y, logoWidth, logoHeight);
                y += logoHeight + 20;
                resolve(null);
            };
        });
    } catch {
        console.log('Logo not found, skipping...');
    }

    // Title with proper centering and spacing
    doc.setFontSize(24);
    doc.setTextColor(255, 113, 25); // #FF7119
    doc.setFont(undefined, 'bold');
    doc.text('Emotionally Yours', pageWidth / 2, y, { align: 'center' });
    y += 12;
    doc.setFontSize(12);
    doc.setTextColor(1, 39, 101); // #012765
    doc.setFont(undefined, 'normal');
    doc.text(`All notes for Appointment #${appointmentData.appointment_id}`, pageWidth / 2, y, { align: 'center' });
    y += 25;

    // Appointment Details Section
    doc.setFontSize(14);
    doc.setTextColor(1, 39, 101);
    doc.setFont(undefined, 'bold');
    doc.text('Appointment Details', margin, y);
    y += 12;

    // Details table
    const details = [
        ['Appointment ID', `#${appointmentData.appointment_id}`],
        ['Client Name', appointmentData.client_name],
        ['Appointment Date', appointmentData.appointment_date],
        ['Slot Time', appointmentData.slot_time],
        ['Client Email', appointmentData.client_email],
        ['Client Phone', appointmentData.client_phone],
        ['Consultation Reason', appointmentData.consultation_reason],
        ['Initial Notes', appointmentData.notes]
    ];

    // Create details table with better spacing
    const detailColWidth = [70, contentWidth - 70];
    const detailRowHeight = 10;

    details.forEach(([label, value], index) => {
        if (y > pageHeight - 60) {
            doc.addPage();
            y = 30;
        }

        // Row background
        doc.setFillColor(index % 2 === 0 ? 248 : 255);
        doc.rect(margin, y - 8, contentWidth, detailRowHeight + 6, 'F');
        
        // Border
        doc.setDrawColor(200);
        doc.rect(margin, y - 8, contentWidth, detailRowHeight + 6);

        // Text with better alignment
        doc.setFontSize(10);
        doc.setTextColor(1, 39, 101);
        doc.setFont(undefined, 'bold');
        doc.text(label, margin + 8, y + 2);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(String(value), margin + detailColWidth[0] + 8, y + 2);
        
        y += detailRowHeight + 6;
    });

    y += 20;

    // Notes Section - only on first page (centered)
    doc.setFontSize(16);
    doc.setTextColor(1, 39, 101);
    doc.setFont(undefined, 'bold');
    doc.text('Notes Section', pageWidth / 2, y, { align: 'center' });
    y += 15;

    if (filteredNotes.length === 0) {
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('No notes available for this appointment.', margin, y);
    } else {
        // Calculate total pages needed for notes
        const notesPerPage = Math.floor((pageHeight - 100) / 25);
        const totalNotesPages = Math.ceil(filteredNotes.length / notesPerPage);
        
        // Table Header with better styling
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(255, 255, 255);
        doc.setFillColor(1, 39, 101);
        doc.rect(margin, y, contentWidth, 15, 'F');

        // Better column widths for improved proportions - fixed the narrow "No." column
        const colWidths = [45, 70, 90, contentWidth - 205]; // Increased "No." column width
        const colX = [margin];
        for (let i = 1; i < colWidths.length; i++) {
            colX[i] = colX[i-1] + colWidths[i-1];
        }

        // Header text with better alignment and no page number overlap
        doc.text('No.', colX[0] + 8, y + 10);
        doc.text('Counsellor', colX[1] + 8, y + 10);
        doc.text('Created At', colX[2] + 8, y + 10);
        doc.text('Note', colX[3] + 8, y + 10);
        y += 18;

        // Table rows with improved styling
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0);

        filteredNotes.forEach((note, index) => {
            // Check if we need a new page - improved logic
            if (y > pageHeight - 100) {
                doc.addPage();
                y = 25;
                
                // Re-add header on new page (but not the "Notes Section" title)
                doc.setFontSize(11);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(255, 255, 255);
                doc.setFillColor(1, 39, 101);
                doc.rect(margin, y, contentWidth, 15, 'F');
                doc.text('No.', colX[0] + 8, y + 10);
                doc.text('Counsellor', colX[1] + 8, y + 10);
                doc.text('Created At', colX[2] + 8, y + 10);
                doc.text('Note', colX[3] + 8, y + 10);
                y += 18;
            }

            // Calculate row height based on note content with better spacing
            const noteText = note.note || 'No note content';
            const noteLines = doc.splitTextToSize(noteText, colWidths[3] - 16);
            const rowHeight = Math.max(noteLines.length * 5 + 12, 16);
            
            // Debug: Log note content to ensure it's being processed
            console.log(`Note ${index + 1}:`, noteText.substring(0, 50) + '...');

            // Row background with better contrast
            doc.setFillColor(index % 2 === 0 ? 245 : 255);
            doc.rect(margin, y - 8, contentWidth, rowHeight + 6, 'F');
            
            // Row border with better visibility
            doc.setDrawColor(180);
            doc.rect(margin, y - 8, contentWidth, rowHeight + 6);

            // Cell borders with better spacing
            doc.rect(colX[0], y - 8, colWidths[0], rowHeight + 6);
            doc.rect(colX[1], y - 8, colWidths[1], rowHeight + 6);
            doc.rect(colX[2], y - 8, colWidths[2], rowHeight + 6);
            doc.rect(colX[3], y - 8, colWidths[3], rowHeight + 6);

            // Cell content with better font and alignment
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text(String(index + 1), colX[0] + 8, y + 6);
            doc.text(note.counsellor, colX[1] + 8, y + 6);
            doc.text(new Date(note.createdAt).toLocaleString(), colX[2] + 8, y + 6);
            
            // Note content with better wrapping and visibility - ensure it's always visible
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0); // Ensure black text for maximum visibility
            doc.text(noteLines, colX[3] + 8, y + 6);

            y += rowHeight + 6;
        });
    }

    // Footer with page numbers - positioned to avoid overlap with table headers
    const totalPages = (doc as any).getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 20, {
            align: 'center',
        });
    }

    doc.save(`appointment-notes-${appointmentData.appointment_id}.pdf`);
}; 