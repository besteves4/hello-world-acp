// Import from "@inrupt/solid-client-authn-browser"
import {
    login,
    handleIncomingRedirect,
    getDefaultSession,
    fetch
  } from "@inrupt/solid-client-authn-browser";
  
  // Import from "@inrupt/solid-client"
  import {
    getSolidDataset,
    getThing,
    getStringNoLocale,
    createSolidDataset,
    createThing,
    setThing,
    addUrl,
    addStringNoLocale,
    saveSolidDatasetAt,
    solidDatasetAsMarkdown,
    acp_v3
  } from "@inrupt/solid-client";

  import { VCARD, SCHEMA_INRUPT, RDF, AS, FOAF } from "@inrupt/vocab-common-rdf";
  
  const buttonLogin = document.querySelector("#btnLogin");
  const buttonRead = document.querySelector("#btnRead");
  const buttonCreate = document.querySelector("#btnCreate");
  buttonCreate.disabled=true;
  const labelCreateStatus = document.querySelector("#labelCreateStatus");
  const buttonGetResourcePolicy = document.querySelector("#btnGetResourcePolicy");
  const buttonUpdateResourcePolicy = document.querySelector("#btnUpdateResourcePolicy");
  const buttonAddPersonalData = document.querySelector("#btnAddPersonalData");

  // 1a. Start Login Process. Call login() function.
  function loginToInruptDotCom() {
    return login({
  
      oidcIssuer: "https://broker.pod.inrupt.com",
  
      redirectUrl: window.location.href,
      clientName: "Hello!!!"
    });
  }
  
  // 1b. Login Redirect. Call handleIncomingRedirect() function.
  // When redirected after login, finish the process by retrieving session information.
  async function handleRedirectAfterLogin() {
    await handleIncomingRedirect();
  
    const session = getDefaultSession();
    if (session.info.isLoggedIn) {
      // Update the page with the status.
      document.getElementById("labelStatus").textContent = "Your session is logged in.";
      document.getElementById("labelStatus").setAttribute("role", "alert");
      // Enable Create button
      buttonCreate.disabled=false;
    }
  }
  
  // The example has the login redirect back to the index.html.
  // This calls the function to process login information.
  // If the function is called when not part of the login redirect, the function is a no-op.
  handleRedirectAfterLogin();
  
  // 2. Read profile
  async function readProfile() {
    const webID = document.getElementById("webID").value;
  
    // The example assumes the WebID has the URI <profileDocumentURI>#<fragment> where
    // <profileDocumentURI> is the URI of the SolidDataset
    // that contains profile data.
    
    // Parse ProfileDocument URI from the `webID` value.
    const profileDocumentURI = webID.split('#')[0];
    document.getElementById("labelProfile").textContent = profileDocumentURI;
  
  
    // Use `getSolidDataset` to get the Profile document.
    // Profile document is public and can be read w/o authentication; i.e.: 
    // - You can either omit `fetch` or 
    // - You can pass in `fetch` with or without logging in first. 
    //   If logged in, the `fetch` is authenticated.
    const myDataset = await getSolidDataset(profileDocumentURI, { fetch: fetch });
  
    // Get the Profile data from the retrieved SolidDataset
    const profile = getThing(myDataset, webID);
  
    // Get the formatted name using `VCARD.fn` convenience object.
    // `VCARD.fn` includes the identifier string "http://www.w3.org/2006/vcard/ns#fn".
    // As an alternative, you can pass in the "http://www.w3.org/2006/vcard/ns#fn" string instead of `VCARD.fn`.
   
    const fn = getStringNoLocale(profile, VCARD.fn);
  
    // Get the role using `VCARD.role` convenience object.
    // `VCARD.role` includes the identifier string "http://www.w3.org/2006/vcard/ns#role"
    // As an alternative, you can pass in the "http://www.w3.org/2006/vcard/ns#role" string instead of `VCARD.role`.
  
    const role = getStringNoLocale(profile, VCARD.role);
  
    // Update the page with the retrieved values.
    document.getElementById("labelFN").textContent = fn;
    document.getElementById("labelRole").textContent = role;
  }
  
  buttonLogin.onclick = function() {  
    loginToInruptDotCom();
  };
  
  buttonRead.onclick = function() {  
    readProfile();
  };

  // 3. Create a Resource and its Access Control Resource
  async function createList() {
    labelCreateStatus.textContent = "";
    const podUrl = document.getElementById("PodURL").value;
 
    let titles = document.getElementById("titles").value.split("\n");

    // Create a new SolidDataset (i.e., the reading list)
    let emptySolidDataset = createSolidDataset();


    // Add titles to the Dataset
    for (let i = 0; i < titles.length; i++) {
      let title = createThing({name: "title" + i});
      title = addUrl(title, RDF.type, AS.Article);
      title = addStringNoLocale(title, SCHEMA_INRUPT.name, titles[i]);
      emptySolidDataset = setThing(emptySolidDataset, title);
    }

    try {
      
      // Save the SolidDataset
       await saveSolidDatasetAt(podUrl, emptySolidDataset, { fetch: fetch });

      labelCreateStatus.textContent = "Saved";
      // Disable Create button
      buttonCreate.disabled=true;

    } catch (error) {
      console.log(error);
      labelCreateStatus.textContent = "Error" + error;
      labelCreateStatus.setAttribute("role", "alert");
    }
  }

buttonCreate.onclick = function() {  
  createList();
};

// 4. Fetch the Resource and display its Access Control Resource.
async function getResourcePolicy() {
  const resourceURL = document.getElementById("ResourceURL").value;
  const solidDatasetWithAcr = await acp_v3.getSolidDatasetWithAcr(resourceURL, { fetch: fetch });

  document.getElementById("policiesRetrieved").value = acp_v3.acrAsMarkdown(solidDatasetWithAcr);
}

buttonGetResourcePolicy.onclick = function() {  
  getResourcePolicy();
};


// 5. Update the Access Control Resource of the created Resource.
async function updateResourcePolicy() {
  const resourceURL = document.getElementById("UpdateResourceURL").value;
  const solidDatasetWithAcr = await acp_v3.getSolidDatasetWithAcr(resourceURL, { fetch: fetch });

 // Create the Resource-specific Rule
  let resourceRule = acp_v3.createResourceRuleFor(solidDatasetWithAcr, "rule-public")
  resourceRule = acp_v3.setPublic(resourceRule);

  // Create the Resource-specific Policy, and add the Rule to it:
  let resourcePolicy = acp_v3.createResourcePolicyFor(solidDatasetWithAcr, "policy-public", );
  resourcePolicy = acp_v3.setAllOfRuleUrl(resourcePolicy, resourceRule, );
  resourcePolicy = acp_v3.setAllowModes(resourcePolicy, { read: true, append: false, write: true }, );

  // Save both the new Rule and the new Policy in the Access Control Resource:
  let updatedResourceWithAcr = acp_v3.setResourceRule(solidDatasetWithAcr, resourceRule, );
  updatedResourceWithAcr = acp_v3.setResourcePolicy(updatedResourceWithAcr, resourcePolicy, );

  // Save the updated Access Control Resource:
  await acp_v3.saveAcrFor(updatedResourceWithAcr, { fetch: fetch });

  document.getElementById("updatedPoliciesRetrieved").value = acp_v3.acrAsMarkdown(updatedResourceWithAcr);
  document.getElementById("policyAsMarkdown").value = acp_v3.policyAsMarkdown(resourcePolicy);
  document.getElementById("ruleAsMarkdown").value = acp_v3.ruleAsMarkdown(resourceRule);
}

buttonUpdateResourcePolicy.onclick = function() {  
  updateResourcePolicy();
};

async function addPersonalData() {
  let personalDataURL = document.getElementById("PersonalDataURL").value;
  // The ACR of a file / folder is created at ?ext=acr
  personalDataURL = personalDataURL + "?ext=acr"

  const personalData = document.getElementById("PersonalData").value;

  const solidDataset = await getSolidDataset(personalDataURL, { fetch: fetch });
  const acr = getThing(solidDataset, personalDataURL);

  // Add personal data category to the dataset
  const dpv = "http://www.w3.org/ns/dpv#"
  const dpvHasPersonalData = "http://www.w3.org/ns/dpv#hasPersonalDataCategory"
  let updatedACR = addStringNoLocale(acr, dpvHasPersonalData, dpv+personalData);

  const myChangedDataset = setThing(solidDataset, updatedACR);

  // The function returns a SolidDataset that reflects your sent data
  const savedProfileResource = await saveSolidDatasetAt(personalDataURL, myChangedDataset, { fetch: fetch });

  document.getElementById("showMetadata").value = solidDatasetAsMarkdown(savedProfileResource);
}

buttonAddPersonalData.onclick = function() {
  addPersonalData();
};