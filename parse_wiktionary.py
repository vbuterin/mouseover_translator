# Get raw data from https://kaikki.org/dictionary/rawdata.html
import json

def print_example(example):
    if 'text' in example and 'english' in example:
        return example['text'] + ': ' + example['english']
    elif 'text' in example:
        return example['text']
    else:
        return ''

def print_sense(sense):
    tags = sense.get('tags', [])
    glosses = sense.get('glosses', [])
    examples = sense.get('examples', [])
    return (
        ('(' if tags else '') +
        ', '.join(tags) +
        (') ' if tags else '') +
        ', '.join(glosses) +
        ('\n\n' if len(examples) else '') +
        '\n'.join([print_example(example) for example in examples])
    )

def print_definition(definition, language):
    pronunciation = ''
    if language == 'Chinese':
        for sound in definition.get('sounds', []):
            if 'Mandarin' in sound.get('tags', []) and 'zh-pron' in sound:
                pronunciation = sound['zh-pron']
                break
    if language == 'Japanese':
        for sound in definition.get('sounds', []):
            if 'other' in sound:
                pronunciation = sound['other']
                break
    senses = definition.get('senses', [])
    defns = '\n\n'.join([print_sense(sense) for sense in senses])
    if pronunciation:
        head = f'{definition["word"]} ({pronunciation}):'
    else:
        head = f'{definition["word"]}:'
    return head + '\n\n' + defns

def is_complete(definition, language):
    if 'word' not in definition:
        return False
    if 'senses' not in definition:
        return False
    if language == 'Chinese':
        for sound in definition.get('sounds', []):
            if 'Mandarin' in sound.get('tags', []) and 'zh-pron' in sound:
                return True
    else:
        return True
    return False

def mk_dictionary(input_file, languages):
    dictionary = {language: {'$scope': 'word'} for language in languages}
    for i in range(10**8):
        line = input_file.readline()
        if not line:
            break
        obj = json.loads(line)
        language = obj.get('lang', None)
        if language in languages and is_complete(obj, language):
            print(i, obj['word'], language)
            dictionary[language][obj['word']] = (
                dictionary[language].get(obj['word'], '') +
                print_definition(obj, language) +
                '\n'
            )
    if 'Chinese' in languages:
        import opencc
        converter = opencc.OpenCC('t2s')
        dictionary['Chinese'] = {
            converter.convert(key): converter.convert(value)
            for key, value in dictionary['Chinese'].items()
        }
        dictionary['Chinese']['$scope'] = 'letter'
        dictionary['Chinese']['$maxlength'] = 4
    elif 'Japanese' in languages:
        dictionary['Japanese']['$scope'] = 'letter'
        dictionary['Japanese']['$maxlength'] = 10
    return dictionary

languages = [
    'Chinese',
    'Spanish',
    'German',
    'Italian',
    'Portuguese',
    'Russian',
    'Ukrainian',
    'Serbo-Croatian',
    'Japanese'
]

if __name__ == '__main__':
    import sys
    input_file = open(sys.argv[1])
    dictionary = mk_dictionary(input_file, languages)
    for lang, item in dictionary.items():
        open('{}.json'.format(lang), 'w').write(json.dumps(item))
