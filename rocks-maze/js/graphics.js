export function createPlayerSVG(color) {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
            <!-- Body -->
            <rect x="10" y="15" width="20" height="15" fill="${color}" rx="3" />
            <!-- Head -->
            <circle cx="20" cy="10" r="6" fill="${color}" />
            <!-- Eye -->
            <circle cx="22" cy="9" r="2" fill="#fff" />
            <!-- Gun/Arm -->
            <rect x="20" y="18" width="12" height="4" fill="#888" rx="1" />
        </svg>
    `;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.src = url;
    return img;
}

export function createRobotSVG(color) {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
            <!-- Tracks/Base -->
            <rect x="8" y="25" width="24" height="8" fill="#555" rx="2" />
            <!-- Body -->
            <rect x="12" y="12" width="16" height="15" fill="${color}" />
            <!-- Head -->
            <rect x="14" y="6" width="12" height="8" fill="#999" rx="1" />
            <!-- Eye -->
            <rect x="18" y="8" width="8" height="3" fill="#f00" />
            <!-- Gun/Arm -->
            <rect x="20" y="16" width="14" height="4" fill="#aaa" />
        </svg>
    `;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.src = url;
    return img;
}
