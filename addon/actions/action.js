import { tracked } from '@glimmer/tracking';
import { assert } from '@ember/debug';
import { isArray } from '@ember/array';
import { camelize } from '@ember/string';
import ArrayProxy from '@ember/array/proxy';
import ObjectProxy from '@ember/object/proxy';
import { getOwner } from '@ember/application';
import { typeOf as emberTypeOf } from '@ember/utils';
import EmberObject from '@ember/object';
import PromiseProxyMixin from '@ember/object/promise-proxy-mixin';

import { reject } from 'rsvp';
import deepMerge from 'lodash.merge';
import normalizePayload from 'ember-custom-actions/utils/normalize-payload';
import urlBuilder from 'ember-custom-actions/utils/url-builder';

const promiseProxies = {
  array: ArrayProxy.extend(PromiseProxyMixin),
  object: ObjectProxy.extend(PromiseProxyMixin),
};

export default class Action {
  @tracked id = '';
  @tracked model = null;
  @tracked instance = false;
  @tracked integrated = false;

  _options = false;

  constructor({
    id = '',
    model = null,
    integrated = false,
    instance = false,
    options = false,
  }) {
    this.id = id;
    this.model = model;
    this.integrated = integrated;
    this.instance = instance;
    this.options = options;

    assert('Custom actions require model property to be passed!', this.model);
    assert(
      'Custom action model has to be persisted!',
      !(this.instance && !this.model?.id)
    );
  }

  /**
    @private
    @return {DS.Store}
  */
  get store() {
    return this.model?.store;
  }

  /**
    @public
    @return {Object}
  */
  get options() {
    return this._options ?? {};
  }

  set options(value) {
    this._options = value;
  }

  /**
    @private
    @return {String}
  */
  get modelName() {
    const { constructor } = this.model;
    return constructor.modelName || constructor.typeKey;
  }

  /**
    @private
    @return {DS.Adapter}
  */
  get adapter() {
    return this.store.adapterFor(this.modelName);
  }

  /**
    @private
    @return {DS.Serializer}
  */
  get serializer() {
    return this.store.serializerFor(this.modelName);
  }

  /**
    @private
    @return {Ember.Object}
  */
  get config() {
    const { model } = this;
    const appConfig = model
      ? getOwner(model).resolveRegistration('config:environment')
          .emberCustomActions || {}
      : {};
    const mergedConfig = deepMerge({}, appConfig, this.options);

    return EmberObject.create(mergedConfig);
  }

  /**
    @public
    @method callAction
    @return {Promise}
  */
  callAction() {
    const promise = this._promise();
    const responseType = camelize(this.config?.responseType || '');
    const promiseProxy = promiseProxies[responseType];

    return promiseProxy ? promiseProxy.create({ promise }) : promise;
  }

  /**
    @private
    @method queryParams
    @return {Object}
  */
  queryParams() {
    const { queryParams } = this.config || {};

    assert(
      'Custom action queryParams option has to be an object',
      emberTypeOf(queryParams) === 'object'
    );
    return this.adapter.sortQueryParams(queryParams);
  }

  /**
    @private
    @method requestMethod
    @return {String}
  */
  requestMethod() {
    const integrated = this.integrated && this.adapter.methodForCustomAction;
    const method = this.config.method.toUpperCase();

    return integrated ? this._methodForCustomAction(method) : method;
  }

  /**
    @private
    @method requestUrl
    @return {String}
  */
  requestUrl() {
    const integrated = this.integrated && this.adapter.urlForCustomAction;

    return integrated ? this._urlForCustomAction() : this._urlFromBuilder();
  }

  /**
    @private
    @method requestHeaders
    @return {String}
  */
  requestHeaders() {
    const integrated = this.integrated && this.adapter.headersForCustomAction;
    const configHeaders = this.config.headers;
    const headers = integrated
      ? this._headersForCustomAction(configHeaders)
      : configHeaders;

    assert(
      'Custom action headers option has to be an object',
      emberTypeOf(headers) === 'object'
    );
    return headers;
  }

  /**
    @private
    @method requestData
    @return {Object}
  */
  requestData() {
    const integrated = this.integrated && this.adapter.dataForCustomAction;
    const payload = this.config.data;
    const data =
      (integrated ? this._dataForCustomAction(payload) : payload) || {};

    assert(
      'Custom action payload has to be an object',
      emberTypeOf(data) === 'object'
    );

    return normalizePayload(data, this.config.normalizeOperation);
  }

  /**
    @private
    @method ajaxOptions
    @return {Object}
  */
  ajaxOptions() {
    return deepMerge({}, this.config?.ajaxOptions, {
      data: this.requestData(),
      headers: this.requestHeaders(),
    });
  }

  // Internals

  _promise() {
    return this.adapter
      .ajax(this.requestUrl(), this.requestMethod(), this.ajaxOptions())
      .then(this._onSuccess.bind(this), this._onError.bind(this));
  }

  _onSuccess(response) {
    if (this.config?.pushToStore && this._validResponse(response)) {
      let store = this.store;
      let modelClass = this.model.constructor;
      let modelId = this.model.id;
      let actionId = this.id;

      let documentHash = this.serializer.normalizeArrayResponse(
        store,
        modelClass,
        response,
        modelId,
        actionId
      );
      return this.store.push(documentHash);
    }

    return response;
  }

  _onError(error) {
    if (this.config?.pushToStore && isArray(error.errors)) {
      let id = this.model.id;
      let typeClass = this.model.constructor;

      error.serializedErrors = this.serializer.extractErrors(
        this.store,
        typeClass,
        error,
        id
      );
    }

    return reject(error);
  }

  _validResponse(object) {
    return emberTypeOf(object) === 'object' && Object.keys(object).length > 0;
  }

  _urlFromBuilder() {
    let path = this.id;
    let queryParams = this.queryParams();
    let modelName = this.modelName;
    let id = this.instance ? this.model.id : null;
    let url = this.adapter._buildURL(modelName, id);

    return urlBuilder(url, path, queryParams);
  }

  // Adapter integration API

  _urlForCustomAction() {
    let id = this.model.id;
    let actionId = this.id;
    let queryParams = this.queryParams();
    let modelName = this.modelName;
    let adapterOptions = this.config.adapterOptions;
    let snapshot = this.model._createSnapshot();
    snapshot.adapterOptions = adapterOptions;

    return this.adapter.urlForCustomAction(
      modelName,
      id,
      snapshot,
      actionId,
      queryParams
    );
  }

  _methodForCustomAction(method) {
    let actionId = this.id;
    let modelId = this.model.id;

    return this.adapter.methodForCustomAction({
      method,
      actionId,
      modelId,
    });
  }

  _headersForCustomAction(headers) {
    let actionId = this.id;
    let modelId = this.model.id;

    return this.adapter.headersForCustomAction({
      headers,
      actionId,
      modelId,
    });
  }

  _dataForCustomAction(data) {
    let actionId = this.id;
    let modelId = this.model.id;
    let model = this.model;

    return this.adapter.dataForCustomAction({
      data,
      actionId,
      modelId,
      model,
    });
  }
}
