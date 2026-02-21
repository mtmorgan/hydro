import m from "mithril";
import AppState from "./AppState";
import { Status } from "./types";
import { inputXMLFile } from "../services/xmlInput";
import { incrementInputFileKey } from "../services/xmlInput";
import Customer, { parseRetailXML, CustomerRecord } from "./Customer";
import EnergyUse, { parseEnergyUseXML, EnergyUseRecord } from "./EnergyUse";

const enum EnergyFileType {
  CUSTOMER = 0,
  ENERGY_USE,
}

interface EnergyXMLResult {
  file: File;
  fileType: EnergyFileType;
  data: EnergyUseRecord | CustomerRecord | null;
}

const energyXMLFileType = (xmlDoc: Document): EnergyFileType => {
  const root = xmlDoc.documentElement;
  if (root.tagName === "feed" && root.hasAttribute("xmlns:cust")) {
    return EnergyFileType.CUSTOMER;
  }
  return EnergyFileType.ENERGY_USE;
};

const inputEnergyXMLs = (file: File, xmlDoc: Document): EnergyXMLResult => {
  let fileType = energyXMLFileType(xmlDoc);
  let data = null;
  switch (fileType) {
    case EnergyFileType.CUSTOMER:
      data = parseRetailXML(xmlDoc);
      break;
    case EnergyFileType.ENERGY_USE:
      data = parseEnergyUseXML(xmlDoc);
      break;
    default:
  }
  return {
    file: file,
    fileType: fileType,
    data: data,
  };
};

const Energy = {
  status: Status.IDLE,
  fileNames: [] as string[],

  loadXml: async (files: FileList) => {
    const input = await inputXMLFile<EnergyXMLResult>(inputEnergyXMLs, files);
    if (input.error) console.error("Energy loadXML:", input.error);

    Energy.fileNames = input.content.map((elt) => elt.file.name);

    const energyUseInput = input.content
      .filter((elt) => elt.fileType === EnergyFileType.ENERGY_USE)
      .map((elt) => ({ ...elt, data: elt.data as EnergyUseRecord }));
    EnergyUse.init(energyUseInput);

    const customerInput = input.content
      .filter((elt) => elt.fileType == EnergyFileType.CUSTOMER)
      .map((elt) => ({ ...elt, data: elt.data as CustomerRecord }));
    Customer.init(customerInput);

    AppState.recompute();
    incrementInputFileKey();
    Energy.status = Status.READY;

    m.redraw();
  },
};

export default Energy;
