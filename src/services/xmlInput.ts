// Provide a unique key to force re-mounting the component on each use
let inputFileKey = 0;

const incrementInputFileKey = () => {
  inputFileKey += 1;
};

/**
 * Processes multiple XML files and flattens the extracted content.
 * @param {Function} inputProcessor - Extract data from an XML Document (must return an array).
 * @param {FileList} files - The input FileList.
 */
const inputXMLFile = async <T>(
  inputProcessor: (arg0: Document) => T,
  files: FileList,
): Promise<{
  fileNames: string[];
  content: T[];
  error: string | null;
}> => {
  // 1. Convert FileList to Array and process concurrently
  const fileArray = Array.from(files);

  const results = await Promise.all(
    fileArray.map(async (file) => {
      try {
        // 2. Modern async file reading (Baseline 2026)
        const xmlString = await file.text();

        // 3. Native XML parsing
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlString, "application/xml");

        // 4. Validate parsing
        const errorNode = doc.querySelector("parsererror");
        if (errorNode) {
          console.warn(`Parsing error in ${file.name}:`, errorNode.textContent);
          return []; // Return empty for flat() to ignore
        }

        // 5. Invoke your function (should return an array of items)
        const extracted = inputProcessor(doc);
        return Array.isArray(extracted) ? extracted : [extracted];
      } catch (err) {
        console.error(`Failed to read/process ${file.name}:`, err);
        return [];
      }
    }),
  );

  // 6. Flatten results into a single-level array
  return {
    fileNames: fileArray.map((f) => f.name),
    content: results.flat(),
    error: results.length === 0 ? "No files processed successfully" : null,
  };
};

// XML parsing helpers

const nsResolver: XPathNSResolver = (prefix: string | null): string | null => {
  const ns: Record<string, string> = {
    atom: "http://www.w3.org/2005/Atom",
    cust: "http://naesb.org/espi/customer",
    espi: "http://naesb.org/espi",
  };
  return prefix ? ns[prefix] || null : null;
};

const xpathQuery = (parent: Element, xpath: string, type: number) => {
  return document.evaluate(xpath, parent, nsResolver, type, null);
};

const xpathNumber = (parent: Element, xpath: string): number => {
  const result = xpathQuery(parent, xpath, XPathResult.NUMBER_TYPE);
  return result.numberValue;
};

const xpathString = (parent: Element, xpath: string): string => {
  const result = xpathQuery(parent, xpath, XPathResult.STRING_TYPE);
  return result.stringValue;
};

const xmlNumber = (el: Element | null): number | null => {
  const text = el?.textContent?.trim();
  if (!text) return null; // Catches <tag/> and <tag></tag>

  const num = parseFloat(text);
  return isNaN(num) ? null : num; // Catches non-numeric junk
};

const xmlString = (el: Element | null): string | null => {
  const text = el?.textContent?.trim();
  return text ? text : null;
};

export {
  inputXMLFile,
  inputFileKey,
  incrementInputFileKey,
  xpathNumber,
  xpathString,
  xmlNumber,
  xmlString,
};
