document.getElementById("startBot").addEventListener("click", async () => {
    try {
        const fileInput = document.getElementById("jsonFile").files[0];
        const messageTemplate = document.getElementById("messageTemplate").value.trim();

        if (!fileInput) {
            alert("📂 Please select a JSON file first!");
            return;
        }

        if (!messageTemplate) {
            alert("✉️ Please enter a message template!");
            return;
        }

        const contacts = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (!Array.isArray(data)) {
                        throw new Error("Invalid JSON format - expected an array of contacts.");
                    }
                    const cleanedContacts = Array.from(new Map(data.map(contact => [
                        contact.phone.replace(/[^\d+]/g, ""), 
                        { 
                            name: contact.name, 
                            phone: contact.phone.replace(/[^\d+]/g, "") 
                        }
                    ])).values());

                    resolve(cleanedContacts);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error("Error reading file"));
            reader.readAsText(fileInput);
        });

        await new Promise((resolve) => {
            chrome.storage.local.set({ contacts, messageTemplate }, resolve);
        });

        const [tab] = await chrome.tabs.query({ 
            active: true, 
            currentWindow: true,
            url: "*://web.whatsapp.com/*"
        });

        if (!tab) {
            alert("🔴 Please open WhatsApp Web first.");
            return;
        }

        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });
        } catch (error) {
            console.error("Error injecting script:", error);
            alert(`❌ Failed to inject script: ${error.message}`);
        }

    } catch (error) {
        console.error("Error:", error);
        alert(`❌ Error: ${error.message}`);
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const jsonFileInput = document.getElementById('jsonFile');
    const importJsonBtn = document.getElementById('importJsonBtn');
    
    importJsonBtn.addEventListener('click', () => jsonFileInput.click());
    
    jsonFileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const contacts = JSON.parse(e.target.result);
                const contactsList = document.getElementById('contactsList');
                const contactsCount = document.getElementById('contactsCount');
                
                const displayText = contacts.map(contact => 
                    `${contact.name}, ${contact.phone.replace(/\s+/g, '').replace('Gsm:', '')}`
                ).join('\n');
                
                contactsList.value = displayText;
                contactsCount.textContent = contacts.length;
                
                const cleanedContacts = contacts.map(c => ({
                    name: c.name,
                    phone: c.phone.replace(/\s+/g, '').replace('Gsm:', '')
                }));
                
                chrome.storage.local.set({ contacts: cleanedContacts }, function() {
                    console.log('Contacts saved to storage');
                });
                
            } catch (error) {
                console.error('Error parsing JSON:', error);
                alert(`Error: ${error.message}`);
            }
        };
        reader.onerror = function() {
            alert('Error reading file');
        };
        reader.readAsText(file);
    });

    document.getElementById('attachButton').addEventListener('click', () => {
        document.getElementById('fileAttachment').click();
    });
    
    document.getElementById('fileAttachment').addEventListener('change', function(e) {
        const file = e.target.files[0];
        document.getElementById('fileName').textContent = file ? file.name : '';
        chrome.storage.local.set({ attachment: file });
    });
});


////////////////////////////////////////////

document.getElementById('attachButton').addEventListener('click', () => {
    document.getElementById('fileAttachment').click();
});

document.getElementById('fileAttachment').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        document.getElementById('fileName').textContent = file.name;
        chrome.storage.local.set({ attachment: file });
    }
});


///////////////////////////////////////////

document.getElementById("jsonFile").addEventListener("change", async function(event) {
    try {
        const file = event.target.files[0];
        if (!file) return;

        const contacts = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (!Array.isArray(data)) {
                        throw new Error("Invalid JSON format - expected array of contacts");
                    }
                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error("Error reading file"));
            reader.readAsText(file);
        });

        const contactsList = document.getElementById("contactsList");
        const contactsCount = document.getElementById("contactsCount");
        
        const uniqueContacts = [];
        const seenPhones = new Set();
        
        contacts.forEach(contact => {
            const cleanedPhone = contact.phone.replace(/\s+/g, "").replace("Gsm:", "");
            if (!seenPhones.has(cleanedPhone)) {
                seenPhones.add(cleanedPhone);
                uniqueContacts.push({
                    name: contact.name,
                    phone: cleanedPhone
                });
            }
        });

        const displayText = uniqueContacts.map(c => `${c.name}, ${c.phone}`).join("\n");
        contactsList.value = displayText;
        contactsCount.textContent = uniqueContacts.length;
        
        const avgTimePerContact = 11.5; 
        const totalSeconds = Math.round(uniqueContacts.length * avgTimePerContact);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        document.getElementById("timeEstimation").innerHTML = `
            <span class="stat-label"><i class="fas fa-clock"></i> Estimated time:</span>
            <span class="stat-value">${minutes > 0 ? `${minutes}m ` : ''}${seconds}s</span>
            <div class="time-details">(for ${uniqueContacts.length} contacts)</div>
        `;

        await new Promise((resolve) => {
            chrome.storage.local.set({ contacts: uniqueContacts }, resolve);
        });

    } catch (error) {
        console.error("Error loading JSON:", error);
        alert(`❌ Error loading JSON: ${error.message}`);
    }
});


document.getElementById('addSecondMsgBtn').addEventListener('click', () => {
    const container = document.getElementById('secondMessageContainer');
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
});

document.getElementById('attachButton').addEventListener('click', () => {
    document.getElementById('fileAttachment').click();
});

document.getElementById('fileAttachment').addEventListener('change', (e) => {
    const file = e.target.files[0];
    document.getElementById('fileName').textContent = file ? file.name : '';
    chrome.storage.local.set({ attachment: file });
});

document.getElementById("startBot").addEventListener("click", async () => {
    const messageTemplate = document.getElementById("messageTemplate").value;
    const messageTemplate2 = document.getElementById("messageTemplate2").value;
    
    chrome.storage.local.set({ 
        messageTemplate,
        messageTemplate2: messageTemplate2 || null 
    }, () => {
    });
});




///////////////////////////////////


async function processContacts() {
    const { contacts, messageTemplate, messageTemplate2, attachment } = await new Promise(resolve => {
        chrome.storage.local.get(['contacts', 'messageTemplate', 'messageTemplate2', 'attachment'], resolve);
    });

    let successCount = 0;
    let failedCount = 0;
    let duplicateCount = 0;
    const processedNumbers = new Set();

    for (const contact of contacts) {
        try {
            const { name, phone } = contact;
            
            if (processedNumbers.has(phone)) {
                duplicateCount++;
                continue;
            }
            processedNumbers.add(phone);

            const searchBox = await waitForElement("div[title='Search input textbox']", 5000);
            if (!searchBox) {
                failedCount++;
                continue;
            }
            
            searchBox.focus();
            searchBox.textContent = phone;
            searchBox.dispatchEvent(new Event('input', { bubbles: true }));
            
            await delay(3000);

            const chat = await waitForElement(`span[title="${phone}"]`, 3000);
            if (!chat) {
                failedCount++;
                continue;
            }

            chat.click();
            await delay(2000);

            await sendMessage(messageTemplate, name);
            
            if (messageTemplate2) {
                await delay(2000); 
                await sendMessage(messageTemplate2, name);
            }

            if (attachment) {
                await delay(1000);
                await sendAttachment(attachment);
            }

            successCount++;

            await delay(Math.floor(Math.random() * 3000) + 9000);

        } catch (error) {
            console.error(`Error processing ${contact.name}:`, error);
            failedCount++;
        }
    }

    chrome.storage.local.set({ successCount, failedCount, duplicateCount });
    chrome.runtime.sendMessage({
        type: "UPDATE_RESULTS",
        successCount,
        failedCount,
        duplicateCount
    });
}

async function sendMessage(template, name) {
    const message = template.replace(/\[name\]/gi, name);
    const chatInput = await waitForElement("div[title='Type a message']", 3000);
    if (!chatInput) throw new Error("Message input not found");
    
    chatInput.focus();
    chatInput.textContent = message;
    chatInput.dispatchEvent(new Event('input', { bubbles: true }));
    await delay(1000);

    const sendButton = await waitForElement("span[data-icon='send']", 2000);
    if (sendButton) {
        sendButton.click();
        await delay(1000);
    }
}

async function sendAttachment(file) {
    try {
        const attachmentBtn = await waitForElement("span[data-icon='attach-menu-plus']", 2000);
        if (attachmentBtn) {
            attachmentBtn.click();
            await delay(1000);
            
            const fileInput = await waitForElement("input[type='file']", 2000);
            if (fileInput) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                fileInput.files = dataTransfer.files;
                fileInput.dispatchEvent(new Event('change', { bubbles: true }));
                await delay(5000); 
                
                const sendButton = await waitForElement("span[data-icon='send']", 2000);
                if (sendButton) {
                    sendButton.click();
                    await delay(1000);
                }
            }
        }
    } catch (error) {
        console.error("Attachment error:", error);
        throw error;
    }
}

