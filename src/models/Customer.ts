import { xpathString } from "../services/xmlInput";
import { Status } from "./types";

export interface CustomerRecord {
  organisationName: string;
  number: string;
  name: string;
  town: string;
  stateOrProvince: string;
  postalCode: string;
}

export const parseRetailXML = (xmlDoc: Document): CustomerRecord => {
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

interface CustomerInput {
  data: CustomerRecord;
  file: File;
}

const Customer = {
  status: Status.IDLE,
  fileName: null as string | null,
  address: null as CustomerRecord | null,

  init: (customerInput: CustomerInput[]) => {
    if (customerInput.length == 0) return;
    Customer.fileName = customerInput[0].file.name;
    Customer.address = customerInput[0].data;
    Customer.status = Status.READY;
  },
};

export default Customer;
