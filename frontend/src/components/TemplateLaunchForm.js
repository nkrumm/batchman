import React, { useState, useRef, useEffect, useContext, useMemo } from "react";
import { useQuery } from 'react-fetching-library';
import { useLocalStorage, useFetch } from "../hooks.js";

import { navigate } from "@reach/router"
import { parse } from 'query-string';

import { ProfileContext } from "../App.js";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import { GoLightBulb, GoZap, GoInfo } from 'react-icons/go';

import "bootstrap/dist/css/bootstrap.css";

import SchemaForm from "react-jsonschema-form";

import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/keybinding-sublime";
import AceEditor from "react-ace"

import UploadEditor from "./UploadEditor.js"

const handleError = (response) => {
    if (!response.ok) { return false }
    return response.json()  //we only get here if there is no error
}

const log = (type) => console.log.bind(console, type);

function TemplateLaunchForm(props) {
    
    const userProfile = useContext(ProfileContext)
    const [nextflowProfile, setNextflowProfile] = useState("aws");
    const [nextflowConfig, setNextflowConfig] = useState();

    const [workflowUrl, setWorkflowUrl] = useState("");
    const [templateSchema, setTemplateSchema] = useState({});
    const [jsonParams, setJsonParams] = useState();
    const [uploadParams, setUploadParams] = useState(null);
    const [mode, setMode] = useState();
    const [errorMsg, setErrorMsg] = useState();

    const paramsFormRef = useRef(null);

    const template = useMemo(() => {
      try {
        const contentUrl = workflowUrl.replace("github.com", "raw.githubusercontent.com")
        Promise.all([
            fetch(`${contentUrl}/master/template.json`).then(handleError),
            fetch(`${contentUrl}/master/params.json`).then(handleError),
            fetch(`${contentUrl}/master/nextflow.config`),
        ]).then(([templateRes, paramsRes, configRes]) => {
          if (templateRes){
            setTemplateSchema(templateRes)
            setMode("template")
          } else if (paramsRes) {
            setJsonParams(paramsRes)
            setMode("params")
          } else {
            setMode("none")
          }
          parseConfig(configRes);
        })
      } catch(err) {
        console.log(err)
      }
    }, [workflowUrl])
    const parseConfig = (config) => {
        
    }
    const handleSubmit = (params) => {
        var nextflow_params;
        if (uploadParams){ // if file uploaded, use that
          nextflow_params = uploadParams;
        } else if (jsonParams) { // if template or json editing happened (these are synced)
          nextflow_params = JSON.stringify(jsonParams);
        } else {
          nextflow_params = null;
        }
        const [url, hash] = workflowUrl.split("#")
        const payload = {
            git_url: url,
            git_hash: hash,
            nextflow_profile: nextflowProfile,
            'nextflow_params': nextflow_params,
              //resume_fargate_task_arn: resumeSelection || "",
            workgroup: userProfile.selectedWorkgroup.name
        }
        //console.log(payload)
        fetch("/api/v1/workflow", {
            method: "POST",
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(handleError)
        .then(data => {
            navigate(`/workflows/${data.fargateTaskArn}`)
        })
        .catch(error => {error.json().then(setErrorMsg)})
    }
    const handleJsonEdit = (text) => {
      try {
        const jsonVal = JSON.parse(text)
        setJsonParams(jsonVal);
      } catch {
        return false
      }
    }
    return (
        <Container fluid>
        <Row>
            <Col><h2>Submit via template</h2></Col>
        </Row>
        <Row>
        <Col style={{'maxWidth': 976}}>
        <Form className='mt-4' id='git-upload-form'>
            <Form.Group as={Row} controlId="formUrl">
              <Form.Label column sm={3}>Repository URL:</Form.Label>
              <Col sm={9}>
                <Form.Control type="input" value={workflowUrl} onChange={(e) =>setWorkflowUrl(e.target.value)}/>
                {mode === "template" ? <div className="mt-2"><GoInfo color="green"/> Using <tt style={{fontSize: 16}}>template.json</tt>. You may edit values below before submitting or upload a new file.</div> : null}
                {mode === "params" ? <div className="mt-2"><GoInfo color="green"/> Using <tt style={{fontSize: 16}}>params.json</tt>. You may edit values below before submitting or upload a new file.</div> : null}
                {mode === "none" ? <div className="mt-2"><GoInfo color="orange"/> No parameter specification found. If needed, edit or upload appropriate params.json below before submitting.</div> : null}
              </Col>
            </Form.Group>
            {workflowUrl &&
              <div>
                <Form.Group as={Row} controlId="parameters">
                  <Form.Label column sm={3}>
                    Parameters:<br/>
                    {mode === "template" && <span style={{fontWeight: "400", fontStyle: "italic", color: "#999"}}>* indicates required field</span>}
                  </Form.Label>
                  <Col sm={9}>
                    <Tabs defaultActiveKey={mode} id="params-tabs" transition={false} >
                      {mode === "template" && 
                        <Tab eventKey="template" title="Template" disabled={uploadParams !== null}>
                          <SchemaForm schema={templateSchema}
                              formData={jsonParams}
                              ref={paramsFormRef}
                              onSubmit={({formData}) => handleSubmit(formData)}
                              onChange={({formData}) => setJsonParams(formData)}
                              onError={log("errors")} 
                              showErrorList={false}
                          ><div></div></SchemaForm>
                        </Tab>
                      }
                      <Tab eventKey="params" title="Edit JSON" disabled={uploadParams !== null}>
                        <AceEditor
                          mode="text"
                          keyboardHandler="sublime"
                          value={JSON.stringify(jsonParams, undefined, 2)}
                          onChange={handleJsonEdit}
                          name="filed-editor-div"
                          editorProps={{ $blockScrolling: true }}
                          theme="github"
                          height="300px"
                          width="100%"
                          showPrintMargin={false}
                          focus={true} />
                      </Tab>
                      <Tab eventKey="upload" title="Upload">
                        <UploadEditor fileContents={uploadParams} setFileContents={setUploadParams}/>
                      </Tab>
                    </Tabs>
                  </Col>
                </Form.Group>
                <Form.Group as={Row} controlId="formUrl">
                  <Form.Label column sm={3}>Nextflow Profile:</Form.Label>
                  <Col sm={9}>
                    <Form.Control type="input" value={nextflowProfile} onChange={(e) =>setNextflowProfile(e.target.value)}/>
                  </Col>
                </Form.Group>
                <Form.Group>
                    <div style={{textAlign: "right"}}>
                      <Button size="lg" onClick={() => handleSubmit()}>Run Workflow <GoZap /></Button>
                    </div>
                </Form.Group>
              </div>
            //end if workflowUrl
        } 
        </Form>
        </Col>
        </Row>
        </Container>
    )    
}

export default TemplateLaunchForm;