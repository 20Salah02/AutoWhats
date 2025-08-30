async function processContacts() {
    const { contacts, messageTemplate, messageTemplate2, attachment } = await new Promise(resolve => {
        chrome.storage.local.get(['contacts', 'messageTemplate', 'messageTemplate2', 'attachment'], resolve);
    });

    let successCount = 0;
    let failedCount = 0;
    let duplicateCount = 0;
    const processedNumbers = new Set();

    const newChatBtn = await waitForElement("button[title='Nouvelle discussion']");
    if (!newChatBtn) {
        alert(" Could not find new chat button");
        return;
    }
    newChatBtn.click();
    await delay(2000);

    for (const contact of contacts) {
        try {
            const { name, phone } = contact;
            const cleanPhone = phone.replace(/\D/g, '');
            
            if (processedNumbers.has(cleanPhone)) {
                duplicateCount++;
                continue;
            }
            processedNumbers.add(cleanPhone);

            const phoneInput = await waitForElement("p.selectable-text.copyable-text.x15bjb6t.x1n2onr6");
            if (!phoneInput) {
                failedCount++;
                continue;
            }
            
            phoneInput.textContent = cleanPhone;
            phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
            await delay(3000);

            const contactResult = await waitForElement(`span[title='+${cleanPhone}']`, 3000);
            if (!contactResult) {
                failedCount++;
                continue;
            }

            contactResult.click();
            await delay(2000);

            await sendWhatsAppMessage(messageTemplate, name);
            
            if (messageTemplate2 && messageTemplate2.trim() !== '') {
                await delay(2000);
                await sendWhatsAppMessage(messageTemplate2, name);
            }

            if (attachment) {
                await delay(1000);
                await sendAttachment(attachment);
            }

            successCount++;

            await delay(Math.floor(Math.random() * 2000) + 9000);

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

async function sendWhatsAppMessage(template, name) {
    const message = template.replace(/\[name\]/gi, name);
    const messageInput = await waitForElement("p.selectable-text.copyable-text.x15bjb6t.x1n2onr6.default_cursor_cs");
    if (!messageInput) throw new Error("Message input not found");
    
    messageInput.textContent = message;
    messageInput.dispatchEvent(new Event('input', { bubbles: true }));
    await delay(1000);

    const sendButton = await waitForElement("button[aria-label='Envoyer']");
    if (sendButton) {
        sendButton.click();
        await delay(1000);
    }
}

async function sendAttachment(file) {
    try {
        const attachmentBtn = await waitForElement("button[aria-label='Attach']");
        if (attachmentBtn) {
            attachmentBtn.click();
            await delay(1000);
            
            const fileInput = await waitForElement("input[type='file']");
            if (fileInput) {
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                fileInput.files = dataTransfer.files;
                fileInput.dispatchEvent(new Event('change', { bubbles: true }));
                await delay(5000); 
                
                const sendButton = await waitForElement("button[aria-label='Envoyer']");
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

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function waitForElement(selector, timeout = 5000) {
    return new Promise(resolve => {
        const element = document.querySelector(selector);
        if (element) return resolve(element);

        const observer = new MutationObserver(() => {
            const el = document.querySelector(selector);
            if (el) {
                observer.disconnect();
                resolve(el);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        setTimeout(() => {
            observer.disconnect();
            resolve(null);
        }, timeout);
    });
}

chrome.runtime.onMessage.addListener((request) => {
    if (request.type === "START_BOT") {
        processContacts();
    }
    return true;
});

if (window.self === window.top) {
    processContacts();
}