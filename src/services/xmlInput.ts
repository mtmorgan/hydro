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
  inputProcessor: (file: File, doc: Document) => T,
  files: FileList,
): Promise<{
  content: T[];
  error: string | null;
}> => {
  const fileArray = Array.from(files);

  const results = await Promise.all(
    fileArray.map(async (file) => {
      try {
        const xmlString = await file.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlString, "application/xml");
        const errorNode = doc.querySelector("parsererror");
        if (errorNode) {
          console.warn(`Parsing error in ${file.name}:`, errorNode.textContent);
          return []; // Return empty for flat() to ignore
        }

        const extracted = inputProcessor(file, doc);
        return Array.isArray(extracted) ? extracted : [extracted];
      } catch (err) {
        console.error(`Failed to read/process ${file.name}:`, err);
        return [];
      }
    }),
  );

  // 6. Flatten results into a single-level array
  return {
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

export {
  inputXMLFile,
  inputFileKey,
  incrementInputFileKey,
  xpathNumber,
  xpathString,
};
