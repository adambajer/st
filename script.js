document.addEventListener("DOMContentLoaded", () => {
    const startCommandModeButton = document.getElementById("start-command-mode");
    const startCaptureModeButton = document.getElementById("start-capture-mode");
    const transcriptionsContainer = document.getElementById("transcriptions");
    const synth = window.speechSynthesis;
    let isRecording = false;
    let isCaptureMode = false;
    let voiceTriggers = {}; // Store voice triggers and their messages

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.msSpeechRecognition || window.oSpeechRecognition;

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

        buttonWrapper.appendChild(triggerInput);
        buttonWrapper.appendChild(messageInput);
        transcriptionsContainer.appendChild(buttonWrapper);
    };

    const saveTrigger = (trigger, message) => {
        voiceTriggers[trigger] = message;
        localStorage.setItem("voiceTriggers", JSON.stringify(voiceTriggers));
        speakText(`Trigger "${trigger}" saved with message "${message}"`);
    };

    const updateTrigger = (oldTrigger, newTrigger, newMessage) => {
        if (oldTrigger !== newTrigger) {
            delete voiceTriggers[oldTrigger];
        }
        voiceTriggers[newTrigger] = newMessage;
        localStorage.setItem("voiceTriggers", JSON.stringify(voiceTriggers));
        speakText(`Trigger "${oldTrigger}" updated to "${newTrigger}" with message "${newMessage}"`);
    };

    const deleteTrigger = (trigger) => {
        delete voiceTriggers[trigger];
        localStorage.setItem("voiceTriggers", JSON.stringify(voiceTriggers));
        speakText(`Trigger "${trigger}" deleted`);
    };

    const speakText = (text) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'cs-CZ'; // Set the language to Czech
        utterance.rate = 1;
        synth.speak(utterance);
    };

    const startVoiceInput = (callback) => {
        if (!SpeechRecognition) {
            speakText("Váš prohlížeč nepodporuje rozpoznávání řeči.");
            console.warn("Speech recognition is not supported by this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'cs-CZ';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.start();

        recognition.onresult = (event) => {
            const message = event.results[0][0].transcript;
            callback(message);
        };

        recognition.onerror = (event) => {
            speakText("Chyba rozpoznávání řeči");
            console.error("Chyba rozpoznávání řeči", event.error);
        };

        recognition.onend = () => {
            console.log("Speech recognition service disconnected");
        };
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
                    annyang.pause(); // Pause recognition to prompt user
                    speakText(`Řekněte zprávu pro příkaz "${trigger}"`);
                    startVoiceInput((message) => {
                        if (message) {
                            createTriggerButton(trigger, message);
                            saveTrigger(trigger, message);
                        }
                        annyang.resume(); // Resume recognition after input
                    });
                } else if (voiceTriggers[trigger]) {
                    readTextAloud(voiceTriggers[trigger]);
                } else {
                    speakText(`Nebyla nalezena zpráva pro příkaz: "${trigger}"`);
                }
            }
        };

        annyang.addCommands(commands);
        annyang.setLanguage('cs-CZ');

        const toggleRecording = (mode) => {
            if (isRecording) {
                annyang.abort();
                mode.classList.remove('active');
                speakText("Nahrávání zastaveno");
            } else {
                annyang.start();
                mode.classList.add('active');
                speakText("Nahrávání zahájeno");
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
            speakText("Chyba rozpoznávání řeči");
            console.error("Chyba rozpoznávání řeči", event.error);
        });
    } else {
        speakText("annyang není k dispozici.");
        console.warn("annyang není k dispozici.");
    }

    loadTriggers();
});
