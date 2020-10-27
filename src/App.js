import React, { Component } from "react";
import { Form, Col, Row, Button, Jumbotron } from "react-bootstrap";
import Spinner from "react-bootstrap/Spinner";
import Alert from "react-bootstrap/Alert";
import { v4 as uuidv4 } from "uuid";
import "./App.css";
var AWS = require("aws-sdk");
var BucketName = "analyzere";
AWS.config.update({
  accessKeyId: "XXXX",
  secretAccessKey: "XXXXXX",
  sessionToken: "XXXXX",
});

var s3 = new AWS.S3({
  apiVersion: "2006-03-01",
  params: { Bucket: BucketName },
});

var lambda = new AWS.Lambda({ apiVersion: "2015-03-31", region: "us-east-1" });

export default class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      threshold: "",
      limit: "",
      file: "",
      success: false,
      loadingText: false,
      error: false,
      output: "",
      textarealeng: 0,
      lambdaerror: false,
      errmessage: "",
    };

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  refreshPage = () => {
    window.location.reload();
  };

  // Used to close the alert.
  setshow = () => {
    this.setState({ error: false });
  };

  // Check if a file is txt file or not.
  filevalidation() {
    var re = /(?:\.([^.]+))?$/;
    var ext = re.exec(this.state.file.name)[1];
    if (ext === "txt") {
      return true;
    } else {
      return false;
    }
  }

  //HandleChange will update the state values when a user is typed in the form.
  handleChange = (e) => {
    this.setState({ [e.target.id]: e.target.value });
    if (e.target.id === "file") {
      this.setState({ file: e.target.files[0] });
    }
  };

  // Runs after successful response.
  success = () => {
    return (
      <div>
        <Jumbotron style={{ backgroundColor: "#e9ecef" }}>
          <h1>Here are the outputs</h1>
          <textarea
            defaultValue={this.state.output}
            rows={this.state.textarealeng}
            cols={50}
          />
          <p>
            <Button
              className="btn btn-primary my-2 my-sm-0"
              href="#"
              onClick={this.refreshPage}
            >
              Wanna do another time
            </Button>
          </p>
        </Jumbotron>
      </div>
    );
  };

  //handleSubmit is triggered when the user clicks on the submit button.
  async handleSubmit(event) {
    event.preventDefault();
    this.setState({ loadingText: true });
    const filename = uuidv4() + ".txt";
    var inputforinvoke = {
      threshold: this.state.threshold,
      limit: this.state.limit,
      keyName: filename,
    };
    var params1 = {
      Bucket: albumBucketName,
      Key: filename,
      Body: this.state.file,
    };
    var param2 = {
      FunctionName: "arn:aws:lambda:us-east-1:XXXXXX:function:testLamda",
      Payload: JSON.stringify(inputforinvoke),
    };
    var options = { partSize: 10 * 1024 * 1024, queueSize: 1 };
    if (this.filevalidation()) {
      try {
        await s3.upload(params1, options).promise();
        const lambdaresponse = await lambda.invoke(param2).promise();
        if (lambdaresponse.FunctionError === undefined) {
          var resarray = JSON.parse(lambdaresponse.Payload);
          const paylength = resarray.length;
          const multiline = resarray.join("\r\n");
          this.setState({
            loadingText: false,
            success: true,
            output: multiline,
            textarealeng: paylength,
          });
          // console.log(lambdaresponse.Payload);
        }
      } catch (err) {
        this.setState({
          success: false,
          error: true,
          loadingText: false,
          lambdaerror: true,
          errmessage: err.message,
        });
        // console.log(err.message);
        throw err;
      }
    } else {
      this.setState({ success: false, error: true, loadingText: false });
    }
  }
  render() {
    return (
      <div>
        {this.state.success ? (
          this.success()
        ) : (
          <React.Fragment>
            <div className="heading">
              <h1>Analyze_Re</h1>
            </div>
            <Alert
              variant="danger"
              show={this.state.error}
              onClose={() => this.setshow()}
              dismissible
            >
              <Alert.Heading>Aw, snap! Something went wrong.</Alert.Heading>
              {this.state.lambdaerror ? (
                <p>{this.state.errmessage}</p>
              ) : (
                <p>
                  Please check your uploaded file format. Only .txt file
                  extension is supported.
                </p>
              )}
            </Alert>
            <div className="container">
              <div
                style={{ padding: "50px" }}
                className="col-12 col-md-9 offset-md-3 form"
              >
                <Form onSubmit={this.handleSubmit}>
                  <Form.Group as={Row} controlId="threshold">
                    <Form.Label column md={2}>
                      Threshold
                    </Form.Label>
                    <Col md={6}>
                      <Form.Control
                        type="number"
                        placeholder="Threshold"
                        step="0.1"
                        min="0.0"
                        max="1000000000.0"
                        autoFocus
                        required
                        value={this.state.threshold}
                        onChange={this.handleChange}
                      />
                      <Form.Text muted>
                        Must be a number between 0.0 and 1,000,000,000.0
                        (inclusive).
                      </Form.Text>
                    </Col>
                  </Form.Group>
                  <Form.Group as={Row} controlId="limit">
                    <Form.Label column md={2}>
                      Limit
                    </Form.Label>
                    <Col md={6}>
                      <Form.Control
                        type="number"
                        placeholder="Limit"
                        step="0.1"
                        min="0.0"
                        max="1000000000.0"
                        autoFocus
                        required
                        value={this.state.limit}
                        onChange={this.handleChange}
                      />
                      <Form.Text muted>
                        Must be a number between 0.0 and 1,000,000,000.0
                        (inclusive).
                      </Form.Text>
                    </Col>
                  </Form.Group>
                  <Form.Group as={Row} controlId="file">
                    <Form.Label column md={2}>
                      Upload File
                    </Form.Label>
                    <Col md={6}>
                      <Form.File
                        id="file"
                        required
                        placeholder="File Upload"
                        accept=".txt"
                        autoFocus
                        onChange={this.handleChange}
                      />
                      <Form.Text className="text-muted">
                        Only text files are allowed.
                      </Form.Text>
                    </Col>
                  </Form.Group>
                  <Form.Group as={Row}>
                    <Col md={{ span: 4, offset: 6 }}>
                      <Button type="submit" variant="primary">
                        {this.state.loadingText ? (
                          <React.Fragment>
                            <Spinner
                              as="span"
                              animation="grow"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                            />
                            Loading...
                          </React.Fragment>
                        ) : (
                          "Submit"
                        )}
                      </Button>
                    </Col>
                  </Form.Group>
                </Form>
              </div>
            </div>
          </React.Fragment>
        )}
      </div>
    );
  }
}
