//// varFactory Code - v6.1 ////

//// Start loading time ////
const dateNow = new Date();
let factoryStart = dateNow;
    factoryStart = factoryStart.getTime();

console.groupCollapsed('Importing other script libraries...');

//// Debug ////
var script_debug = getDataValue('form_view', 'form_code', 'script_master', 'onclick_event', 'column_name = "debug"');
eval(script_debug);

//// Global Functions ////
var script_globalfunctions = getDataValue('form_view', 'form_code', 'script_master', 'onclick_event', 'column_name = "udf_globalfunctions"');
eval(script_globalfunctions);

//// Toastr ////
$('head').append(Cayuga.toastr.js);
$('head').append(Cayuga.toastr.css);

//// Master ////
var script_master = getDataValue('form_view', 'form_code', 'script_master', 'onclick_event', 'column_name = "master"');
eval(script_master);

console.groupEnd();

const modulesForDemo = ['CLIENTS', 'REFERRAL'];

//// Nested Fix ////
if (Util.isNullOrEmpty(Form.formObject.moduleCode)) {
    Cayuga.throw('warning', 'Module code is null, varFactory will determine module.');
    let isOnParent = Form.formObject.parentColumn === 'people_id';
    let queryParam = Util.getQueryParam('parent_value');
    let validateParam = getDataValue('people', 'people_id', queryParam, 'first_name');
    var useClient = (isOnParent || !Util.isNullOrEmpty(validateParam)) ? true : false;
    
    if (useClient) {
        Cayuga.throw('success', 'Using "CLIENTS" since parent column is "people_id".', null, 1);
        Form.formObject.moduleCode = 'CLIENTS';
        if (Util.isNullOrEmpty(getFormElement('people_id'))) {
            setFormElement('people_id', queryParam);
        }
    } else {
        Cayuga.throw('warning', `Did not set, parent column is ${Form.formObject.parentColumn}`, null, 1);
    }
}

getClientInfo = function(limit) {
    if (Form.formObject.parentColumn === 'people_id') { //modulesForDemo.includes(Form.formObject.moduleCode)
        const pId = Cayuga.findPeopleId();
        const pgm = Cayuga.findProgramId();
        if (Util.isNullOrEmpty(pId)) {return null;}//|| Util.isNullOrEmpty(pgm)) { return null; }
        const newClient = Cayuga.getPersonInfo(pId, pgm, null, limit);
        const infoLength = (!Util.isNullOrEmpty(newClient)) ? JSON.stringify(newClient).length : 0;
        Cayuga.throw((infoLength > 0 ? 'success' : 'error'), 'getClientInfo returned object length ' + infoLength, null, 1);
        return newClient;
    } else {
        return null;
    }
};

const query = `
                select
                    s.staff_id as staffId
                    , ss.description as userNavScheme
                    , p.first_name as userFirstName
                    , p.last_name as userLastName
                    , CONCAT (
                        p.first_name
                        , ' '
                        , p.last_name
                    ) as userFullName
                    , (
                        select distinct
                            staff_id as s
                        from staff
                        where
                            supervisor_id = '${Form.formObject.workerID}'
                        for XML path('')
                    ) as userSupervisees
                    , j.job_title as userJobTitle
                    , j.can_supervise as userIsSupervisor
                    , sl.profile_name as userSiteName
                    , c.description as userCredential
                    , c.signature as userSignature
                from staff as s
                    left join security_scheme as ss on ss.security_scheme_id = s.security_scheme_id
                    left join people as p on p.people_id = s.people_id
                    left join jobtitle as j on j.jobtitle_id = s.jobtitle_id
                    left join (
                        select
                            g.profile_name,
                            sl.staff_id
                        from staff_site_link as sl
                            left join group_profile as g on g.group_profile_id = sl.group_profile_id
                        where is_primary_mo = 1
                    ) as sl on sl.staff_id = s.staff_id
                    left join (
                        select top 1
                            sh.staff_id,
                            b.description,
                            sh.signature
                        from staff_credentials_history as sh
                            left join billing_staff_credentials as b on b.billing_staff_credentials_id = sh.billing_staff_credentials_id
                        where sh.staff_id = '${Form.formObject.workerID}'
                        order by sh.effective_date DESC
                    ) as c on c.staff_id = s.staff_id
                where s.staff_id = '${Form.formObject.workerID}'
            `;
            
            
launchIntoOrbit = function(limit) {
    // Get new information //
    const results = Cayuga.shortQuery(query);
    window.top.Orbit = results[0];
    
    // Get Client Info
    window.top.Orbit.previousParent = parentValue;
    window.top.Orbit.client = getClientInfo(limit);
    
    window.top.Orbit.launchDate = dateNow;
    Cayuga.throw('success', `Launched variable satellites into Orbit on ${dateNow}!`);
};

getVarFactory = function(setVariable) {
    try {
        
        ///////////////////////////////////////////
        //// 1/26/23 MJW - ORBIT CONFIGURATION ////
        // Replaces varFactory from having to load 100 times,
        // load once per parent, per session.
        
        console.groupCollapsed('Orbit');
        
        if (!Util.isNullOrEmpty(window.top.Orbit)) {
            Cayuga.throw('success', `Satellites are already in Orbit.`);
            
            // 2/3/23 MJW Add catch for incomplete satellites.
            if (Object.keys(window.top.Orbit).length < 15) {
                Cayuga.throw('error', `Orbit didn't load correctly, so the system automatically relaunched to prevent further errors. You can proceed in completing this form, but please submit a Helpdesk Ticket so we can diagnose this issue.`, {isConfirm: false});
                launchIntoOrbit(false);
                
            } else if (!Util.isNullOrEmpty(window.top.Orbit.launchDate)) {
                // Previously launched into orbit, check to see if old data.
                let minutes = Cayuga.date.getMinutesBetween(window.top.Orbit.launchDate, dateNow);
                if (minutes <= 30) {
                    Cayuga.throw('action', `Satellites were launched ${Math.floor(minutes)} minutes ago, and are still in Orbit.`, null, 1);
                    if (!Util.isNullOrEmpty(parentValue)) {
                        if (window.top.Orbit.previousParent !== parentValue) {
                            Cayuga.throw('warning', 'The parentValue has changed! Updating Orbit.', null, 1);
                            
                            // Get new client information //
                            window.top.Orbit.client = getClientInfo(false);
                            
                            window.top.Orbit.previousParent = parentValue;
                            Cayuga.throw('success', `New previousParent: ${window.top.Orbit.previousParent}`, null, 1);
                            
                        } else {
                            Cayuga.throw('info', 'previousParent was the same, so not fully updating Orbit.', null, 1);
                            if (Form.formObject.parentColumn === 'people_id') { //modulesForDemo.includes(Form.formObject.moduleCode)) {
                                let newClientInfo = getClientInfo(true);
                                let oldClientInfo = window.top.Orbit.client;
                                if (!Cayuga.isAnyEmpty([oldClientInfo, newClientInfo])) {
                                    window.top.Orbit.client = Cayuga.mergeDeep(oldClientInfo, newClientInfo);
                                    Cayuga.throw('info', 'New client satellite launched into Orbit.', null, 2);
                                } else {
                                    Cayuga.throw('warning', 'Something went wrong - the system tried to merge new information, but either window.top.Orbit.client was missing, or results from newClientInfo was missing. The system will now get a new complete set of data to avoid an error...', null, 2);
                                    window.top.Orbit.client = getClientInfo(false);
                                    window.top.Orbit.launchDate = dateNow;
                                }
                            }
                        }
                    } else {
                        Cayuga.throw('info', 'parentValue was empty, so ignoring.', null, 1);
                    }
                } else {
                    // Greater than 30 minutes, so relaunch into orbit
                    Cayuga.throw('action', `Satellites fell out of Orbit ${Math.floor(30-minutes)} minutes ago, so relaunching...`);
                    launchIntoOrbit(false);
                }
            } else {
                Cayuga.throw('warning', `Satellites in Orbit didn't have a launchDate, so the system automatically relaunched them to get new information.`);
                launchIntoOrbit(false);
            }
            
        } else {
            Cayuga.throw('action', 'There are no satellites in Orbit, preparing to launch!');
            launchIntoOrbit(false);
        }
        
        // Determine if user is author of form or is author's supervisor //
        if (formAction === 'ADD') {
            window.top.Orbit.userIsAuthor = true;
            window.top.Orbit.userIsAuthorSup = false; // To do: replace with function
        } else if (Form.formObject.formCode !== 'EVENTS2DO_CLI_NEW') {
            let authorField = !Util.isNullOrEmpty(getFormElement('staff_id')) 
                                    ? 'staff_id' 
                                    : $('[title="Entered by"]').attr('field_name');
                authorField = Util.isNullOrEmpty(authorField)
                                    ? $('[title="Entered By"]').attr('field_name') 
                                    : authorField;
            
            if (Util.isNullOrEmpty(authorField)) {
                Cayuga.throw('warning', `varFactory could not find the field that stores the author's staff_id`);
                window.top.Orbit.userIsAuthor = false;
                window.top.Orbit.userIsAuthorSup = false;
                
            } else {
                Cayuga.throw('info', `Author field retrieved: ${authorField}`);
                window.top.Orbit.userIsAuthor = window.top.Orbit.staffId === getFormElement(authorField);
                window.top.Orbit.userIsAuthorSup = (
                    !Util.isNullOrEmpty(window.top.Orbit.userSupervisees)) 
                        ? window.top.Orbit.userSupervisees.includes(getFormElement(authorField).toUpperCase()) 
                        : false;
            }
            
        } else {
            window.top.Orbit.userIsAuthor = false;
            window.top.Orbit.userIsAuthorSup = false;
        }
        
        //////////////////////////////////////////////
        
        //// Add Orbit variables to existing Form.formObject for compatibility with older scripts. ////
        if (setVariable === false) {
            // If we don't need to set anything to formObject, and we just want the results from varFactory to be returned, then return them.
            return window.top.Orbit;
        } else {
            let factoryFL = Form.getFormLineByColumnName('varFactory');
            
            if (!Util.isNullOrEmpty(factoryFL)) {
                // OLD - Need to replace! Set varFactory to the stringified object as long as it exists on the form.
                setFormElement('varFactory', JSON.stringify({
                    staffId: window.top.Orbit.staffId,
                    isAuthor: window.top.Orbit.userIsAuthor,
                    isAuthorSup: window.top.Orbit.userIsAuthorSup,
                    navScheme: window.top.Orbit.userNavScheme,
                    first_name: window.top.Orbit.userFirstName,
                    last_name: window.top.Orbit.userLastName,
                    job_title: window.top.Orbit.userJobTitle,
                    is_supervisor: window.top.Orbit.userIsSupervisor,
                    siteName: window.top.Orbit.userSiteName,
                    credentials: window.top.Orbit.userCredential,
                    signature: window.top.Orbit.userSignature
                }));
                
                // Set varFactory to not dirty.
                factoryFL.isDirty = false;
                
            } else {
                Cayuga.throw('warning', 'varFactory was asked to set the variable on the form to the results object, but that field was not found on the form. Skipping this!');
            }
                
            // Set variables to formObject for compatibility
            Form.formObject = Cayuga.mergeDeep(Form.formObject, window.top.Orbit);
        }
    } catch (error) { 
        Cayuga.throw('error', `varFactory encountered an error: ${error}`, {isConfirm: false});
        window.top.Orbit = null;
    }
    
    console.log('Orbit:', window.top.Orbit);
    console.groupEnd();
};

if (Util.isNullOrEmpty(getFormElement('varFactory'))) {
    getVarFactory(true);
} else {
    getVarFactory(false);
}

//// Finish timer ////
let factoryEnd = new Date();
    factoryEnd = factoryEnd.getTime();
let factoryTime = factoryEnd - factoryStart;

Cayuga.throw('info', `varFactory loaded in ${factoryTime / 1000} seconds...`, null, '~~~~');

//// End of varFactory ////
