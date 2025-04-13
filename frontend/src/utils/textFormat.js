export const parseLines = (value) => {
    if (!value) return value;
    // First replace escaped newlines, then ensure consistent line breaks
    return value.replace(/\\n/g, '\n');
  };