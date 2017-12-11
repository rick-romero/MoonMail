import omitEmpty from 'omit-empty';
import App from './App';
import UserContext from './lib/UserContext';
import Events from './domain/Events';
import RecipientModel from './domain/RecipientModel';
import Recipients from './domain/Recipients';
import EventLog from './EventLog';
import HttpUtils from './lib/HttpUtils';

async function createRecipient(event, context, callback) {
  try {
    App.configureLogger(event, context);
    App.logger().info('createRecipient', JSON.stringify(event));
    const { recipient } = JSON.parse(event.body);
    const user = await UserContext.byApiKey(event.requestContext.identity.apiKey);
    const recipientCreatedEvent = Events.buildRecipientCreatedEvent({ listId: event.pathParameters.listId, userId: user.id, recipient });
    console.log('HERE 1', JSON.stringify(recipientCreatedEvent));
    await EventLog.write({ topic: Events.listRecipientCreated, streamName: process.env.LIST_RECIPIENT_STREAM_NAME, payload: recipientCreatedEvent });
    console.log('HERE 2');
    HttpUtils.buildApiResponse({ statusCode: 202, body: { id: RecipientModel.buildId(recipient) } }, callback);
  } catch (error) {
    App.logger().error(error);
    HttpUtils.apiErrorHandler(error, callback);
  }
}

async function updateRecipient(event, context, callback) {
  try {
    App.configureLogger(event, context);
    App.logger().info('updateRecipient', JSON.stringify(event));
    const params = JSON.parse(event.body);
    const user = await UserContext.byApiKey(event.requestContext.identity.apiKey);
    const recipientUpdatedEvent = Events.buildRecipientUpdatedEvent({ listId: event.pathParameters.listId, userId: user.id, id: event.pathParameters.recipientId, params });
    await EventLog.write({ topic: Events.listRecipientUpdated, streamName: process.env.LIST_RECIPIENT_STREAM_NAME, payload: recipientUpdatedEvent });
    HttpUtils.buildApiResponse({ statusCode: 202, body: { id: event.recipientId } }, callback);
  } catch (error) {
    App.logger().error(error);
    HttpUtils.apiErrorHandler(error, callback);
  }
}

async function deleteRecipient(event, context, callback) {
  try {
    App.configureLogger(event, context);
    App.logger().info('deleteRecipient', JSON.stringify(event));
    const user = await UserContext.byApiKey(event.requestContext.identity.apiKey);
    const recipientDeletedEvent = Events.buildRecipientCreatedEvent({ listId: event.pathParameters.listId, userId: user.id, recipient: event.pathParameters.recipientId });
    await EventLog.write({ topic: Events.listRecipientDeleted, streamName: process.env.LIST_RECIPIENT_STREAM_NAME, payload: recipientDeletedEvent });
    HttpUtils.buildApiResponse({ statusCode: 202, body: {} }, callback);
  } catch (error) {
    App.logger().error(error);
    HttpUtils.apiErrorHandler(error, callback);
  }
}

async function listRecipients(event, context, callback) {
  try {
    App.configureLogger(event, context);
    App.logger().info('listRecipients', JSON.stringify(event));
    const user = await UserContext.byApiKey(event.requestContext.identity.apiKey);
    const options = event.options || {};
    // FIXME: try to pass conditions in the query string
    const conditions = JSON.parse(event.body);
    const recipients = await Recipients.searchRecipientsByListAndConditions(event.pathParameters.listId, conditions, omitEmpty(options));
    HttpUtils.buildApiResponse({ statusCode: 200, body: recipients }, callback);
  } catch (error) {
    App.logger().error(error);
    HttpUtils.apiErrorHandler(error, callback);
  }
}


async function getRecipient(event, context, callback) {
  try {
    App.configureLogger(event, context);
    App.logger().info('getRecipient', JSON.stringify(event));
    const user = await UserContext.byApiKey(event.requestContext.identity.apiKey);
    const recipient = await Recipients.getRecipient({ listId: event.pathParameters.listId, userId: user.id, id: event.pathParameters.recipientId });
    HttpUtils.buildApiResponse({ statusCode: 200, body: recipient }, callback);
  } catch (error) {
    App.logger().error(error);
    HttpUtils.apiErrorHandler(error, callback);
  }
}

export default {
  createRecipient,
  updateRecipient,
  deleteRecipient,
  listRecipients,
  getRecipient
};
