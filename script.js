document.addEventListener("DOMContentLoaded", () => {
    const startCommandModeButton = document.getElementById("start-command-mode");
    const startCaptureModeButton = document.getElementById("start-capture-mode");
    const transcriptionsContainer = document.getElementById("transcriptions");
    const synth = window.speechSynthesis;
    let isRecording = false;
    let isCaptureMode = false;
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
        utterance.lang = 'cs-CZ'; // Set the language to Czech
        utterance.rate = 1;
        synth.speak(utterance);
    };

    if (annyang) {
        const commands = {
            '*trigger': (trigger) => {
                if (isCaptureMode) {
                    const message = prompt(`Zadejte zprávu pro příkaz "${trigger}":`);
                    if (message) {
                        createTriggerButton(trigger, message);
                        saveTrigger(trigger, message);
                    }
                } else if (voiceTriggers[trigger]) {
                    readTextAloud(voiceTriggers[trigger]);
                } else {
                    alert(`Nebyla nalezena zpráva pro příkaz: "${trigger}"`);
                }
            }
        };

        annyang.addCommands(commands);
        annyang.setLanguage('cs-CZ');

        const toggleRecording = (mode) => {
            if (isRecording) {
                annyang.abort();
                mode.classList.remove('active');
            } else {
                annyang.start();
                mode.classList.add('active');
            }
            isRecording = !isRecording;
        };

        startCommandModeButton.addEventListener("click", () => {
            isCaptureMode = false;
            toggleRecording(startCommandModeButton);
            startCaptureModeButton.classList.remove('active');
        });

        startCaptureModeButton.addEventListener("click", () => {
            isCaptureMode = true;
            toggleRecording(startCaptureModeButton);
            startCommandModeButton.classList.remove('active');
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Control") {
                if (isCaptureMode) {
                    toggleRecording(startCaptureModeButton);
                } else {
                    toggleRecording(startCommandModeButton);
                }
            }
        });

        annyang.addCallback('end', () => {
            if (isRecording) {
                if (isCaptureMode) {
                    toggleRecording(startCaptureModeButton);
                } else {
                    toggleRecording(startCommandModeButton);
                }
            }
        });

        annyang.addCallback('error', (event) => {
            console.error("Chyba rozpoznávání řeči", event.error);
        });
    } else {
        console.warn("annyang není k dispozici.");
    }

    loadTriggers();
});
