document.addEventListener("DOMContentLoaded", () => {
    const startRecordingButton = document.getElementById("start-recording");
    const transcriptionsContainer = document.getElementById("transcriptions");
    const toggleCommandModeButton = document.getElementById("toggle-command-mode");
    const synth = window.speechSynthesis;
    let isRecording = false;
    let isCommandMode = false;
    let voiceTriggers = {}; // Store voice triggers and their messages

    const loadTriggers = () => {
        const storedTriggers = JSON.parse(localStorage.getItem("voiceTriggers")) || {};
        voiceTriggers = storedTriggers;
        for (const trigger in storedTriggers) {
            createTriggerButton(trigger, storedTriggers[trigger]);
        }
    };

    const createTriggerButton = (trigger, message) => {
        const buttonWrapper = document.createElement("div");
        buttonWrapper.className = "transcription-button";

        const triggerInput = document.createElement("input");
        triggerInput.type = "text";
        triggerInput.value = trigger;
        triggerInput.className = "text-input";
        triggerInput.disabled = true;

        const messageInput = document.createElement("input");
        messageInput.type = "text";
        messageInput.value = message;
        messageInput.className = "text-input";
        messageInput.disabled = true;

        const editButton = document.createElement("button");
        editButton.className = "edit-button";
        editButton.innerHTML = "✏️";
        editButton.addEventListener("click", () => {
            triggerInput.disabled = !triggerInput.disabled;
            messageInput.disabled = !messageInput.disabled;
            if (!triggerInput.disabled) {
                editButton.innerHTML = "✔️";
            } else {
                editButton.innerHTML = "✏️";
                updateTrigger(trigger, triggerInput.value, messageInput.value);
            }
        });

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-button";
        deleteButton.innerHTML = "🗑️";
        deleteButton.addEventListener("click", () => {
            buttonWrapper.remove();
            deleteTrigger(trigger);
        });

        buttonWrapper.appendChild(deleteButton);
        buttonWrapper.appendChild(triggerInput);
        buttonWrapper.appendChild(messageInput);
        buttonWrapper.appendChild(editButton);
        transcriptionsContainer.appendChild(buttonWrapper);
    };

    const saveTrigger = (trigger, message) => {
        voiceTriggers[trigger] = message;
        localStorage.setItem("voiceTriggers", JSON.stringify(voiceTriggers));
    };

    const updateTrigger = (oldTrigger, newTrigger, newMessage) => {
        if (oldTrigger !== newTrigger) {
            delete voiceTriggers[oldTrigger];
        }
        voiceTriggers[newTrigger] = newMessage;
        localStorage.setItem("voiceTriggers", JSON.stringify(voiceTriggers));
    };

    const deleteTrigger = (trigger) => {
        delete voiceTriggers[trigger];
        localStorage.setItem("voiceTriggers", JSON.stringify(voiceTriggers));
    };

    const readTextAloud = (text) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        synth.speak(utterance);
    };

    toggleCommandModeButton.addEventListener("click", () => {
        isCommandMode = !isCommandMode;
        toggleCommandModeButton.classList.toggle('active');
    });

    if (annyang) {
        const commands = {
            '*trigger': (trigger) => {
                if (isCommandMode) {
                    const message = prompt(`Enter message for trigger "${trigger}":`);
                    if (message) {
                        createTriggerButton(trigger, message);
                        saveTrigger(trigger, message);
                    }
                } else if (voiceTriggers[trigger]) {
                    readTextAloud(voiceTriggers[trigger]);
                } else {
                    alert(`No message found for trigger: "${trigger}"`);
                }
            }
        };

        annyang.addCommands(commands);
        annyang.setLanguage('en-US');

        const toggleRecording = () => {
            if (isRecording) {
                annyang.abort();
                startRecordingButton.classList.remove('active');
            } else {
                annyang.start();
                startRecordingButton.classList.add('active');
            }
            isRecording = !isRecording;
        };

        startRecordingButton.addEventListener("click", toggleRecording);

        document.addEventListener("keydown", (event) => {
            if (event.key === "Control") {
                toggleRecording();
            }
        });

        annyang.addCallback('end', () => {
            if (isRecording) {
                toggleRecording();
            }
        });

        annyang.addCallback('error', (event) => {
            console.error("Speech recognition error", event.error);
        });
    } else {
        console.warn("annyang is not available.");
    }

    loadTriggers();
});
