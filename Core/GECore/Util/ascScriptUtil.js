import { Regex } from "../../../settings.js";

const tokenStyle = {
    "import": "color:rgb(255, 77, 136)",
    "export": "color:rgb(255, 77, 136)",
    "return": "color:rgb(255, 77, 136)",

    "new": "color:rgb(77, 148, 255)",
    "function": "color:rgb(77, 148, 255)",
    "const": "color:rgb(77, 148, 255)",
    "in": "color:rgb(77, 148, 255)",
    "out": "color:rgb(77, 148, 255)",
    "uniform": "color:rgb(77, 148, 255)",
    "void": "color:rgb(77, 148, 255)",
    "null": "color:rgb(77, 148, 255)",

    "(": "color:rgb(255, 204, 0)",
    ")": "color:rgb(255, 204, 0)",

    "{": "color:rgb(0, 153, 255)",
    "}": "color:rgb(0, 153, 255)",

    "\"": "color:rgb(255, 140, 26)",
    "\'": "color:rgb(255, 140, 26)",

    "?": "color:white",
    "<": "color:white",
    ">": "color:white",
    ";": "color:white",
    ":": "color:white",
    "=": "color:white",
    ",": "color:white",
    ".": "color:white",
    "|": "color:white",
    "&": "color:white",
    "!": "color:white",
}

export class AscScriptUtil {
    static formatCode(text) {
        const charactersWithNoSpaceBefore = ['\n', '.', '/', ',', '<', '>', '(', ')', ';'];
        const charactersWithNoSpaceAfter = ['\t', '\n', '.', '<', '>', '/', '(', "\"", "\'"];
        const sameCharacterToggles = {
            "\"": false
        };

        let tabs = 0;
        let result = "";
        let seqRes = "";
        const sequence = [];

        const tokenStream = this.textToTokenStream(text);

        function writeSpace(lastCharacter, currentToken) {
            const empty = "";
            const space = " ";

            if (Object.hasOwn(sameCharacterToggles, currentToken)) sameCharacterToggles[currentToken] = !sameCharacterToggles[currentToken];

            if (lastCharacter == space) return empty;
            if (lastCharacter == ')' &&
                currentToken == ',' ||
                currentToken == '.' ||
                currentToken == ';') return empty;
            if (lastCharacter == '(' && currentToken == '\"') return empty;
            if (Object.hasOwn(sameCharacterToggles, currentToken)) {
                return (!sameCharacterToggles[currentToken]) ? empty : space;
            }
            if (charactersWithNoSpaceBefore.includes(currentToken) || charactersWithNoSpaceAfter.includes(lastCharacter)) return empty;
            return space;
        }

        function writeStyle(space, token) {
            const str = space + "%c" + token;
            seqRes += str;

            if (token == "(") sequence[sequence.length - 1] = "color:rgb(255, 236, 179)";
            if (token == ">") sequence[sequence.length - 1] = "color:rgb(0, 230, 0)";

            let style = "color:#6FC2E9";
            if (Object.hasOwn(tokenStyle, token)) style = tokenStyle[token];
            else if (token.startsWith("//") || token.startsWith("/*")) style = "color:rgb(0, 230, 77)";
            else if (token.startsWith("\"")) style = tokenStyle["\""];
            else if (token.startsWith("\'")) style = tokenStyle["\'"];
            sequence.push(style);
        }

        function writeToken(token) {
            const space = writeSpace(result.at(-1), token);
            const str = space + token;
            result += str;
            
            writeStyle(space, token);
        }

        function writeTabs() {
            for (let i = 0; i < tabs; i++) {
                result += "\t";
                seqRes += "\t";
            }
        }

        function endOfLine(tokenStream) {
            writeToken('\n');
            const next = tokenStream.next();
            if (!next.done) {
                const token = next.value;
                if (token == '}') closedBracketToken(tokenStream);
                else {
                    writeTabs();
                    processToken(token);
                }
            }
        }

        function commentSingleLineToken(token) {
            writeToken('\n');
            writeTabs();
            writeToken(token);
            writeTabs();
        }

        function commentMultiLineToken(tokenStream, token) {
            writeToken(token);
            endOfLine(tokenStream);
        }

        function importToken(tokenStream) {
            writeToken("import");
            let token = tokenStream.next();
            while (token.value != ';') {
                if (token.done) break;
                writeToken(token.value);
                token = tokenStream.next();
            }
            semicolonToken(tokenStream);
        }

        function quotesToken(tokenStream, character) {
            writeToken(character);
            let token = tokenStream.next();
            while (token.value != character) {
                if (token.done) break;
                writeToken(token.value);
                token = tokenStream.next();
            }
            writeToken(character);
        }

        function doubleQuotesToken(tokenStream) {
            quotesToken(tokenStream, "\"");
        }

        function singleQuotesToken(tokenStream) {
            quotesToken(tokenStream, "\'");
        }

        function openBracketToken(tokenStream) {
            writeToken('{');
            tabs++;
            endOfLine(tokenStream);
        }

        function closedBracketToken(tokenStream) {
            tabs--;
            writeTabs();
            writeToken('}');
            writeToken('\n');
            endOfLine(tokenStream);
        }

        function semicolonToken(tokenStream) {
            writeToken(';');
            endOfLine(tokenStream);
        }

        const delegateMap = {
            "import": () => importToken(tokenStream),
            '{': () => openBracketToken(tokenStream),
            '}': () => closedBracketToken(tokenStream),
            '\"': () => doubleQuotesToken(tokenStream),
            '\'': () => singleQuotesToken(tokenStream),
            ';': () => semicolonToken(tokenStream),
            "//": (token) => commentSingleLineToken(token),
            "/*": (token) => commentMultiLineToken(tokenStream, token),
        }

        function processToken(token) {
            if (Object.hasOwn(delegateMap, token)) delegateMap[token]();
            else if (token.startsWith("//")) delegateMap["//"](token);
            else if (token.startsWith("/*")) delegateMap["/*"](token);
            else writeToken(token);
        }

        function processFirstToken(token) {
            processToken(token);
            result = result.trimStart();
            seqRes = seqRes.trimStart();
        }

        processFirstToken(tokenStream.next().value);
        for (const token of tokenStream) {
            processToken(token);
        }

        return {formattedText: result, stylized: [seqRes, ...sequence]};
    }

    static flattenCode(text) {
        return text.trim()
            .replaceAll(Regex.excess_white_space, " ")
    }

    /** @param {string} text */
    static textToTokenStream(text) {
        if (text == null || text == "") throw new Error("No text ?");
        return text
            .split(Regex.token_separator)
            .filter(e => e)
            .values();
    }

    static getClassName(text) {
        const tokenStream = this.textToTokenStream(text);
        let token = tokenStream.next();
        while (token.value != "class") {
            if(token.done) return null;
            token = tokenStream.next();
        }
        return tokenStream.next().value;
    }

    static getInheritance(text, className) {
        const tokenStream = this.textToTokenStream(text);
        const metaData = { parent: null, interfaces: [] };

        for (const token of tokenStream) {
            if (token == "class" && tokenStream.next().value == className) {
                let inheritanceType = tokenStream.next().value;
                if (inheritanceType == "extends") {
                    metaData.parent = tokenStream.next().value;
                    inheritanceType = tokenStream.next().value;
                }
                if (inheritanceType == "implements") {
                    let head = tokenStream.next().value;
                    while (head != "{") {
                        if (head != ",") metaData.interfaces.push(head);
                        head = tokenStream.next().value;
                    }
                }
                return metaData;
            }
        }
    }

    static getSerializedMembers(text, className) {
        if (className == null) throw new Error("No Class name provided.");
        const tokenStream = this.textToTokenStream(text);
        while (tokenStream.next().value != "class" || tokenStream.next().value != className) { }
        const dv = [];

        let bracketCounter = 0;
        for (const token of tokenStream) {
            if (token == '{') bracketCounter++;
            else if (token == '}') {
                bracketCounter--;
                if (bracketCounter == 0) break;
            }
            else if (token == "@Serialize") {
                dv.push(tokenStream.next().value);
            }
        }
        return dv;
    }
}