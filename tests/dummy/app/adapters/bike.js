import JSONAPIAdapter from '@ember-data/adapter/json-api';
import { AdapterMixin } from 'ember-custom-actions';

export default class BikeAdapter extends JSONAPIAdapter.extend(AdapterMixin) {}
