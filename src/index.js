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
    getThingAll,
    getStringNoLocale,
    createSolidDataset,
    createThing,
    setThing,
    addUrl,
    addStringNoLocale,
    saveSolidDatasetAt
  } from "@inrupt/solid-client";

  import {
    getSolidDatasetWithAcr,
    saveAcrFor
  } from "@inrupt/solid-client/acp/acp"

  import {
    createResourceRuleFor,
    setPublic,
    setAllOfRuleUrl,
    setResourceRule
  } from "@inrupt/solid-client/acp/rule"
  
  import {
    createResourcePolicyFor,
    setAllowModes,
    setResourcePolicy
  } from "@inrupt/solid-client/acp/policy"

  import { VCARD, SCHEMA_INRUPT, RDF, AS } from "@inrupt/vocab-common-rdf";
  
  const buttonLogin = document.querySelector("#btnLogin");
  const buttonRead = document.querySelector("#btnRead");
  const buttonCreate = document.querySelector("#btnCreate");
  buttonCreate.disabled=true;
  const labelCreateStatus = document.querySelector("#labelCreateStatus");
  const buttonGetResourcePolicy = document.querySelector("#btnGetResourcePolicy");

  // 1a. Start Login Process. Call login() function.
  function loginToInruptDotCom() {
    return login({
  
      oidcIssuer: "https://broker.pod.inrupt.com",
  
      redirectUrl: window.location.href,
      clientName: "Getting started app"
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
    // For illustrative purposes, the `fetch` is passed in.
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

  // 3. Create the Reading List
  async function createList() {
    labelCreateStatus.textContent = "";
    const podUrl = document.getElementById("PodURL").value;
 
    let titles = document.getElementById("titles").value.split("\n");

    // Create a new SolidDataset (i.e., the reading list)
    let myReadingList  = createSolidDataset();
   
    // Add titles to the Dataset
    for (let i = 0; i < titles.length; i++) {
      let title = createThing({name: "title" + i});
      title = addUrl(title, RDF.type, AS.Article);
      title = addStringNoLocale(title, SCHEMA_INRUPT.name, titles[i]);
      myReadingList = setThing(myReadingList, title);
    }

    try {
      
      // Save the SolidDataset 
      let savedReadingList = await saveSolidDatasetAt(
        podUrl,
        myReadingList,
        { fetch: fetch }
      );

      labelCreateStatus.textContent = "Saved";
      // Disable Create button
      buttonCreate.disabled=true;

      // Refetch the Reading List
      savedReadingList = await getSolidDataset(
        podUrl,
        { fetch: fetch }
      );

      let items = getThingAll(savedReadingList);

      let listcontent="";
      for (let i = 0; i < items.length; i++) {
        let item = getStringNoLocale(items[i], SCHEMA_INRUPT.name);
        if (item != null) {
            listcontent += item + "\n";
        }
      }

      document.getElementById("savedtitles").value = listcontent;

    } catch (error) {
      console.log(error);
      labelCreateStatus.textContent = "Error" + error;
      labelCreateStatus.setAttribute("role", "alert");
    }
  }

buttonCreate.onclick = function() {  
  createList();
};

// 4. Manage the access to a Resource //https://pod.inrupt.com/beatrizesteves/tests/myList
async function getResourcePolicy() {
  const resourceURL = document.getElementById("ResourceURL").value;

  // Fetch the Resource and its Access Control Resource
  const resourceWithAcr = await getSolidDatasetWithAcr(resourceURL, { fetch: fetch });

  // Create the Resource-specific Rule
  let resourceRule = createResourceRuleFor(resourceWithAcr, "rule-public")
  resourceRule = setPublic(resourceRule);

  // Create the Resource-specific Policy, and add the Rule to it:
  let resourcePolicy = createResourcePolicyFor(
    resourceWithAcr,
    "policy-public",
  );
  resourcePolicy = setAllOfRuleUrl(
    resourcePolicy,
    resourceRule,
  );
  resourcePolicy = setAllowModes(
    resourcePolicy,
    { read: true, append: false, write: false },
  );

  // Save both the new Rule and the new Policy in the Access Control Resource:
  let updatedResourceWithAcr = setResourceRule(
    resourceWithAcr,
    resourceRule,
  );
  updatedResourceWithAcr = setResourcePolicy(
    updatedResourceWithAcr,
    resourcePolicy,
  );

  // Save the updated Access Control Resource:
  await saveAcrFor(updatedResourceWithAcr);

  // Display policies
  document.getElementById("policiesRetrieved").value = updatedResourceWithAcr;
}

buttonGetResourcePolicy.onclick = function() {  
  getResourcePolicy();
};