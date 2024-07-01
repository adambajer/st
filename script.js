document.addEventListener("DOMContentLoaded", () => {
    const startRecordingButton = document.getElementById("start-recording");
    const startSoundCaptureButton = document.getElementById("start-sound-capture");
    const transcriptionsContainer = document.getElementById("transcriptions");
    const languageSelect = document.getElementById("language");
    const voiceSelect = document.getElementById("voice");
    const voiceForm = document.getElementById("voiceForm");
    const toggleCommandModeButton = document.getElementById("toggle-command-mode");
    const synth = window.speechSynthesis;
    let voices = [];
    let isRecording = false;
    let isPlaying = false;
    let isCommandMode = false;
    let mediaRecorder;
    let audioChunks = [];
    let audioStartTime;
    let predefinedTexts = {}; // Store predefined texts for buttons

    const loadTranscriptions = () => {
        const storedTranscriptions = JSON.parse(localStorage.getItem("transcriptions")) || [];
        storedTranscriptions.forEach(text => {
            createTranscriptionButton(text);
        });
    };

    const createTranscriptionButton = (text) => {
        const buttonWrapper = document.createElement("div");
        buttonWrapper.className = "transcription-button";

        const button = document.createElement("button");
        button.className = "text-button";
        button.textContent = text;
        button.addEventListener("click", () => {
            if (!isPlaying) {
                isPlaying = true;
                readTextAloud(text);
            }
        });

        const editButton = document.createElement("button");
        editButton.className = "edit-button";
        editButton.innerHTML = "✏️";
        editButton.addEventListener("click", () => {
            const newText = prompt("Edit transcription:", text);
            if (newText) {
                button.textContent = newText;
                updateTranscription(text, newText);
            }
        });

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-button";
        deleteButton.innerHTML = "🗑️";
        deleteButton.addEventListener("click", () => {
            buttonWrapper.remove();
            deleteTranscription(text);
        });

        const predefinedTextButton = document.createElement("button");
        predefinedTextButton.className = "predefined-text-button";
        predefinedTextButton.innerHTML = "Set Predefined Text";
        predefinedTextButton.addEventListener("click", () => {
            const predefinedText = prompt("Set predefined text for this button:", predefinedTexts[text] || "");
            if (predefinedText) {
                predefinedTexts[text] = predefinedText;
            }
        });

        buttonWrapper.appendChild(deleteButton);
        buttonWrapper.appendChild(button);
        buttonWrapper.appendChild(editButton);
        buttonWrapper.appendChild(predefinedTextButton);
        transcriptionsContainer.appendChild(buttonWrapper);
    };

    const saveTranscription = (text) => {
        let storedTranscriptions = JSON.parse(localStorage.getItem("transcriptions")) || [];
        storedTranscriptions.push(text);
        localStorage.setItem("transcriptions", JSON.stringify(storedTranscriptions));
    };

    const updateTranscription = (oldText, newText) => {
        let storedTranscriptions = JSON.parse(localStorage.getItem("transcriptions")) || [];
        const index = storedTranscriptions.indexOf(oldText);
        if (index !== -1) {
            storedTranscriptions[index] = newText;
            localStorage.setItem("transcriptions", JSON.stringify(storedTranscriptions));
        }
    };

    const deleteTranscription = (text) => {
        let storedTranscriptions = JSON.parse(localStorage.getItem("transcriptions")) || [];
        storedTranscriptions = storedTranscriptions.filter(transcription => transcription !== text);
        localStorage.setItem("transcriptions", JSON.stringify(storedTranscriptions));
        delete predefinedTexts[text]; // Remove predefined text for the deleted button
    };

    startSoundCaptureButton.addEventListener("click", () => {
        if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
            startSoundCaptureButton.classList.remove('active');
        } else {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    mediaRecorder = new MediaRecorder(stream);
                    audioStartTime = Date.now();

                    mediaRecorder.ondataavailable = event => {
                        audioChunks.push(event.data);
                    };

                    mediaRecorder.onstop = () => {
                        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                        const audioUrl = URL.createObjectURL(audioBlob);
                        const audioDuration = (Date.now() - audioStartTime) / 1000;
                        createAudioButton(audioUrl, audioDuration);
                        audioChunks = [];
                    };

                    mediaRecorder.start();
                    startSoundCaptureButton.classList.add('active');
                })
                .catch(error => {
                    console.error("Error accessing microphone: ", error);
                });
        }
    });

    const createAudioButton = (audioUrl, duration) => {
        const buttonWrapper = document.createElement("div");
        buttonWrapper.className = "transcription-button";

        const button = document.createElement("button");
        button.className = "edit-button";
        button.innerHTML = "&#9654;"; // Triangle icon for play
        button.addEventListener("click", () => {
            const audio = new Audio(audioUrl);
            audio.play();
        });

        const info = document.createElement("button");
        info.textContent = `Raw Audio (${duration.toFixed(2)}s)`;
        info.className = "text-button";

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-button";
        deleteButton.innerHTML = "🗑️";
        deleteButton.addEventListener("click", () => {
            buttonWrapper.remove();
        });

        buttonWrapper.appendChild(deleteButton);
        buttonWrapper.appendChild(info);
        buttonWrapper.appendChild(button);
        transcriptionsContainer.appendChild(buttonWrapper);
    };

    const populateVoices = () => {
        voices = synth.getVoices();
        const languages = [...new Set(voices.map(voice => voice.lang))];

        languages.forEach(lang => {
            const option = document.createElement("option");
            option.value = lang;
            option.textContent = lang;
            languageSelect.appendChild(option);
        });

        languageSelect.addEventListener("change", updateVoices);
        updateVoices();
    };

    const updateVoices = () => {
        const selectedLanguage = languageSelect.value;
        voiceSelect.innerHTML = '';
        voices.filter(voice => voice.lang === selectedLanguage).forEach(voice => {
            const option = document.createElement("option");
            option.value = voice.name;
            option.textContent = voice.name;
            voiceSelect.appendChild(option);
        });
    };

    voiceForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const text = prompt("Enter text to speak:") || "Hello, this is a test.";
        readTextAloud(text);
    });

    const readTextAloud = (text) => {
        const utterance = new SpeechSynthesisUtterance(text);
        const selectedVoiceName = voiceSelect.value;
        const selectedVoice = voices.find(voice => voice.name === selectedVoiceName);
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
        utterance.rate = Math.random() * (1.5 - 0.5) + 0.5;

        utterance.onend = () => {
            isPlaying = false;
        };
        synth.speak(utterance);
    };

    toggleCommandModeButton.addEventListener("click", () => {
        isCommandMode = !isCommandMode;
        toggleCommandModeButton.classList.toggle('active');
    });

    if (annyang) {
        const commands = {
            '*text': (text) => {
                if (isCommandMode && predefinedTexts[text]) {
                    readTextAloud(predefinedTexts[text]);
                } else {
                    createTranscriptionButton(text);
                    saveTranscription(text);
                }
            }
        };

        annyang.addCommands(commands);
        annyang.setLanguage('cs-CZ');

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
    }

    synth.onvoiceschanged = populateVoices;
    loadTranscriptions();
});
