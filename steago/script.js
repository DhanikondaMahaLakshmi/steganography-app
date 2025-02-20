const imageInput = document.getElementById("imageInput");
const messageInput = document.getElementById("message");
const passwordInput = document.getElementById("password");
const encodeButton = document.getElementById("encodeButton");
const decodeButton = document.getElementById("decodeButton");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const downloadLink = document.getElementById("downloadLink");

let img = new Image();

// Load the selected image
imageInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
});

// Function to encrypt message using password
function encryptMessage(message, password) {
    let encrypted = "";
    for (let i = 0; i < message.length; i++) {
        encrypted += String.fromCharCode(message.charCodeAt(i) ^ password.charCodeAt(i % password.length));
    }
    return btoa(encrypted); // Convert to base64
}

// Function to decrypt message using password
function decryptMessage(encryptedMessage, password) {
    let decoded = atob(encryptedMessage); // Convert from base64
    let decrypted = "";
    for (let i = 0; i < decoded.length; i++) {
        decrypted += String.fromCharCode(decoded.charCodeAt(i) ^ password.charCodeAt(i % password.length));
    }
    return decrypted;
}

// Encode the message in the image
encodeButton.addEventListener("click", () => {
    if (!img.src || messageInput.value.trim() === "" || passwordInput.value.trim() === "") {
        alert("Please select an image, enter a message, and set a password.");
        return;
    }

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    // Encrypt message
    const encryptedMessage = encryptMessage(messageInput.value, passwordInput.value);
    const binaryMessage = encryptedMessage.split("")
        .map(char => char.charCodeAt(0).toString(2).padStart(8, "0"))
        .join("");

    // Store message length (first 32 bits)
    const messageLength = binaryMessage.length.toString(2).padStart(32, "0");

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Store message length in first 32 pixels
    for (let i = 0; i < 32; i++) {
        data[i * 4] = (data[i * 4] & 0xFE) | parseInt(messageLength[i]);
    }

    // Store encrypted message in pixels
    for (let i = 0; i < binaryMessage.length; i++) {
        data[(i + 32) * 4] = (data[(i + 32) * 4] & 0xFE) | parseInt(binaryMessage[i]);
    }

    ctx.putImageData(imageData, 0, 0);
    downloadLink.href = canvas.toDataURL();
    downloadLink.style.display = "inline";
});

// Decode the hidden message
decodeButton.addEventListener("click", () => {
    if (!img.src || passwordInput.value.trim() === "") {
        alert("Please select an image and enter the password.");
        return;
    }

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let messageLengthBinary = "";

    // Read message length from first 32 pixels
    for (let i = 0; i < 32; i++) {
        messageLengthBinary += (data[i * 4] & 1);
    }

    const messageLength = parseInt(messageLengthBinary, 2);
    let binaryMessage = "";

    // Read encrypted message
    for (let i = 0; i < messageLength; i++) {
        binaryMessage += (data[(i + 32) * 4] & 1);
    }

    let encryptedMessage = "";
    for (let i = 0; i < binaryMessage.length; i += 8) {
        const byte = binaryMessage.slice(i, i + 8);
        encryptedMessage += String.fromCharCode(parseInt(byte, 2));
    }

    // Decrypt the message
    try {
        const decryptedMessage = decryptMessage(encryptedMessage, passwordInput.value);
        alert("Decoded Message: " + decryptedMessage);
    } catch (error) {
        alert("Incorrect password or corrupted image.");
    }
});
