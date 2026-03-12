// Utility to generate .ics files for calendar export

export interface CalendarEvent {
    title: string;
    description: string;
    startDate: Date;
    durationMinutes: number;
}

const formatICSDate = (date: Date): string => {
    // ICS requires UTC format: YYYYMMDDThhmmssZ
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

export const generateICSFile = (events: CalendarEvent[], filename: string) => {
    let icsContent = 'BEGIN:VCALENDAR\n';
    icsContent += 'VERSION:2.0\n';
    icsContent += 'PRODID:-//StudyGenie//NONSGML v1.0//EN\n';

    events.forEach(event => {
        const endDate = new Date(event.startDate.getTime() + event.durationMinutes * 60000);

        icsContent += 'BEGIN:VEVENT\n';
        icsContent += `DTSTAMP:${formatICSDate(new Date())}\n`;
        icsContent += `DTSTART:${formatICSDate(event.startDate)}\n`;
        icsContent += `DTEND:${formatICSDate(endDate)}\n`;
        icsContent += `SUMMARY:${event.title}\n`;
        icsContent += `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}\n`; // Handle line breaks
        icsContent += 'END:VEVENT\n';
    });

    icsContent += 'END:VCALENDAR\n';

    // Create a Blob and trigger download
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
};
