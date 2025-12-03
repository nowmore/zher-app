export const parseMessage = (text) => {
    if (!text) return [];
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map(part => {
        if (part.match(urlRegex)) {
            return { type: 'link', content: part, url: part };
        }
        return { type: 'text', content: part };
    });
};
