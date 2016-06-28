import * as chai from 'chai';
const expect = chai.expect;
import chaiAsPromised from 'chai-as-promised';
import chaiThings from 'chai-things';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import awsMock from 'aws-sdk-mock';
import AWS from 'aws-sdk';
import { ImportRecipientsService } from './import_recipients_service';
import { Recipient } from 'moonmail-models';
import * as sinonAsPromised from 'sinon-as-promised';
chai.use(sinonChai);
chai.use(chaiAsPromised);
chai.use(chaiThings);

describe('ImportRecipientsService', () => {
  const lambdaContext = {
    functionName: 'lambda-function-name',
    getRemainingTimeInMillis: () => { }
  };
  let contextStub;
  let lambdaClient;
  let s3Client;

  before(() => {
    awsMock.mock('S3', 'getObject', {
      Body: `email,first name,last name
            "em1@examplemail.com","firstName1","lastName1"
            "em2@examplemail.com","firstName2","lastName2"
            `,
      Metadata: '{"first name":"name","last name":"surname"}'
    });
    sinon.stub(Recipient, 'saveAll').resolves('Ok');
    contextStub = sinon.stub(lambdaContext, 'getRemainingTimeInMillis').returns(100000);
    awsMock.mock('Lambda', 'invoke', 'ok');
    lambdaClient = new AWS.Lambda();
    s3Client = new AWS.S3();
  });

  describe('#importAll', () => {
    context('when a csv file uploaded', () => {
      const serviceParams = {
        s3Event: {
          bucket: {
            name: 'Random S3 import bucket'
          },
          object: {
            key: 'userId.listId#1.amarker.csv'
          }
        }
      };
      it('imports recipients', (done) => {
        const importRecipientsService = new ImportRecipientsService(serviceParams, s3Client, lambdaClient, contextStub);
        expect(importRecipientsService).to.have.property('listId', 'listId#1');
        expect(importRecipientsService).to.have.property('fileExt', 'csv');
        expect(importRecipientsService).to.have.property('importOffset', 0);
        expect(importRecipientsService).to.have.deep.property('s3Event', serviceParams.s3Event);
        importRecipientsService.importAll().then(() => {
          expect(Recipient.saveAll).to.have.been.called;
          const args = Recipient.saveAll.lastCall.args[0];
          expect(args.length).to.equals(2);
          
          expect(args[0].userId).to.equals('userId');
          expect(args[0].listId).to.equals('listId#1');
          expect(args[0].email).to.equals('em1@examplemail.com');
          expect(args[0].status).to.equals('subscribed');
          expect(args[0].isConfirmed).to.be.true;
          expect(args[0].metadata).to.deep.equals({ name: 'firstName1', surname: 'lastName1' });
          

          expect(args[1].userId).to.equals('userId');
          expect(args[1].listId).to.equals('listId#1');
          expect(args[1].email).to.equals('em2@examplemail.com');
          expect(args[1].status).to.equals('subscribed');
          expect(args[1].isConfirmed).to.be.true;
          expect(args[1].metadata).to.deep.equals({ name: 'firstName2', surname: 'lastName2' });
          
          done();
        }).catch((err) => console.log(err, err.stack));
      });
    });
  });

  after(() => {
    awsMock.restore('S3');
    awsMock.restore('Lambda');
    contextStub.restore();
    Recipient.saveAll.restore();
  });
});
