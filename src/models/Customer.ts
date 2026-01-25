import m from "mithril";
import AppState from "./AppState";
import {
  inputXMLFile,
  incrementInputFileKey,
  xpathString,
} from "../services/xmlInput";

export interface Address {
  organisationName: string;
  number: string;
  name: string;
  town: string;
  stateOrProvince: string;
  postalCode: string;
}

const inputRetailXML = (xmlDoc: Document): Address => {
  const serviceSupplier = xmlDoc.getElementsByTagName(
    "cust:ServiceSupplier",
  )[0];
  const serviceLocation = xmlDoc.getElementsByTagName(
    "cust:ServiceLocation",
  )[0];

  return {
    organisationName: xpathString(
      serviceSupplier,
      "./cust:Organisation/cust:organisationName",
    ),
    number: xpathString(
      serviceLocation,
      "./cust:mainAddress/cust:streetDetail/cust:number",
    ),
    name: xpathString(
      serviceLocation,
      "./cust:mainAddress/cust:streetDetail/cust:name",
    ),
    town: xpathString(
      serviceLocation,
      "./cust:mainAddress/cust:townDetail/cust:name",
    ),
    stateOrProvince: xpathString(
      serviceLocation,
      "./cust:mainAddress/cust:townDetail/cust:stateOrProvince",
    ),
    postalCode: xpathString(
      serviceLocation,
      "./cust:mainAddress/cust:postalCode",
    ),
  };
};

const Customer = {
  ready: false,
  fileName: null as string | null,
  address: null as Address | null,
  loadXml: async (files: FileList) => {
    Customer.ready = false;
    Customer.fileName = null;
    Customer.address = null;
    inputXMLFile(inputRetailXML, files)
      .then((input) => {
        if (input.error) {
          console.error("Customer loadXML:", input.error);
        }
        Customer.fileName = files[0]?.name || null;
        Customer.address = input.content[0];
        Customer.ready = true;
      })
      .then(() => AppState.recompute())
      .then(() => {
        incrementInputFileKey();
        m.redraw();
      });
  },
};

export default Customer;
