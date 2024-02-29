// Create a tooltip element
const tooltip = document.createElement('div');
tooltip.style.position = 'absolute';
tooltip.style.padding = '5px';
tooltip.style.background = 'lightyellow';
tooltip.style.border = '1px solid black';
tooltip.style.borderRadius = '5px';
tooltip.style.display = 'none';
tooltip.style.zIndex = '1000';
document.body.appendChild(tooltip);

window.translated = false;

// Function to load and parse the CSV file
function loadDictionary(language) {
  return fetch(chrome.runtime.getURL(`dicts/${language}.json`))
    .then(response => response.text())
    .then(text => {
      return JSON.parse(text);
      const dictionary = {};
      const lines = text.split('\n');
      for (let line of lines) {
        const parts = line.split(',');
        if (parts.length === 2) {
          dictionary[parts[0].trim()] = parts[1].trim();
        }
      }
      return dictionary;
    })
    .catch(error => console.error('Error loading dictionary:', error));
}

function translationsToDivHTML(translations) {
    return (
        '<div>' +
        translations.replaceAll('\n', '</div><div style="margin-top: 20px">') +
        '</div>'
    )
}


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log(request);
    if (request.message === "clicked_browser_action") {
        if (window.translated) {
            alert('Error: already added translations to this page');
            return;
        }
        alert(`Translating ${request.language}`);
        loadDictionary(request.language).then(translationDict => {
            
            function wrapWords(element) {
              if (element.hasChildNodes()) {
                element.childNodes.forEach(child => {
                  if (child.nodeType === Text.TEXT_NODE) {
                    let newHtml = '';
                    if (translationDict['$scope'] == 'word') {
                        newHtml = child.textContent.replace(/([\w'А-Яа-яґієїčžšć]+)/g, '<span class="hover-word">$1</span>');
                    }
                    else if (translationDict['$scope'] == 'letter') {
                        let maxLength = translationDict['$maxlength']
                        newHtml = '';
                        spaces = Array(maxLength+1).join(' ');
                        let paddedContent = spaces + child.textContent + spaces;
                        for (var i = 0; i < child.textContent.length; i++) {
                            neighborhood = paddedContent.slice(i, i + maxLength * 2 - 1);
                            newHtml += (
                                '<span class="hover-character" neighborhood="' +
                                neighborhood +
                                '">' +
                                child.textContent[i] +
                                '</span>'
                            );
                        }
                    }
                    let tempDiv = document.createElement('span');
                    tempDiv.innerHTML = newHtml;
                    element.replaceChild(tempDiv, child);
                  } else if (child.tagName != 'A') {
                    wrapWords(child);
                  }
                });
              }
            }
            
            // Function to handle mouseover event on words
            function handleMouseover(event) {
              if (event.target.classList.contains('hover-word')) {
                let word = event.target.textContent.trim();
                let translation = translationDict[word] || translationDict[word.toLowerCase()];
                if (translation) {
                  tooltip.innerHTML = translationsToDivHTML(translation);
                  tooltip.style.display = 'block';
                  tooltip.style.left = `${event.pageX + 15}px`;
                  tooltip.style.top = `${event.pageY}px`;
                }
              }
              if (event.target.classList.contains('hover-character')) {
                let maxLength = translationDict['$maxlength']
                allTranslations = '';
                for (var len = maxLength; len > 0; len--) {
                    for (var startPos = maxLength - len + 1; startPos <= maxLength; startPos++) {
                        slice = event.target.getAttribute('neighborhood').slice(startPos, startPos + len);
                        if (translationDict[slice]) {
                            allTranslations += translationDict[slice] + "\n";
                        }
                    }
                }
                if (allTranslations) {
                  tooltip.innerHTML = translationsToDivHTML(allTranslations);
                  tooltip.style.display = 'block';
                  tooltip.style.left = `${event.pageX + 15}px`;
                  tooltip.style.top = `${event.pageY}px`;
                }
              }
            }
            
            // Function to hide tooltip on mouseout
            function handleMouseout() {
              tooltip.style.display = 'none';
            }
            
            // Add event listeners and wrap words in the body
            
            wrapWords(document.body);
            document.querySelectorAll('.hover-word, .hover-character').forEach(word => {
              word.addEventListener('mouseover', handleMouseover);
              word.addEventListener('mouseout', handleMouseout);
            });
            alert("Translations ready");
            window.translated = true;
        });
    }
});
