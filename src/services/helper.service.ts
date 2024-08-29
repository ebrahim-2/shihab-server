import { Injectable } from '@nestjs/common';
import { isValid, parse } from 'date-fns';

@Injectable()
export class HelperService {
  parseFloatOrNull(value: any): number {
    return value !== '-' ? parseFloat(value) : null;
  }

  parseIntOrNull(value: any): number | null {
    return value !== '-' ? parseInt(value) : null;
  }

  parseStringOrNull(value: any): string | null {
    return value !== '-' ? value : null;
  }

  private dateFormats = [
    'yyyy-MM-dd',
    'dd-MMM-yy',
    'yyyy-MM-dd HH:mm',
    'dd-MMM-yy hh:mm a',
    'MMM d yyyy h:mma',
    'MMM d yyyy  h:mma',
    'MMM  d yyyy h:mma',
    'MMM  d yyyy  h:mma',
    'MMM  dd yyyy  h:mma',
    'MMM  dd yyyy h:mma',
    'MMM dd yyyy h:mma',
  ];

  parseDateDynamic(dateString: string | undefined | null): Date | null {
    if (!dateString || dateString === '') {
      return null;
    }

    let date;

    // If ISO parsing fails, try other formats
    for (const format of this.dateFormats) {
      date = parse(dateString, format, new Date());
      if (isValid(date)) return date;
    }

    // If all parsing attempts fail, log error and return null
    console.error(`Failed to parse date: ${dateString}`);
    return null;
  }

  parseDateTime(dateString: string, timeString: string): Date | null {
    const combinedString = `${dateString} ${timeString}`;
    const date = this.parseDateDynamic(combinedString);

    if (!date) {
      console.error(`Failed to parse date and time: ${combinedString}`);
      return null;
    }

    return date;
  }
}
