class ::Tree::DataAttributesController < ApplicationController
  include ::Nsud::Essentials::TreeDataMartAttributable::Controller
  include ::Nsud::Essentials::TreeLazyLoadable::NodesController

  def index
    respond_to do |format|
      format.json do
        render_jstree_elements
      end
    end
  end

  def render_jstree_elements
    render json:
             jstree_serializer.eql?(NilClass) ?
               jstree_collection :
               ActiveModelSerializers::SerializableResource.new(
                 jstree_collection,
                 each_serializer: jstree_serializer,
                 **jstree_opts
               ).serializable_hash
  end

  def jstree_opts
    super

    # in case - load/reload from root element
    if jstree_opts_parent_id.eql?('0')
      @jstree_opts.merge!( params.permit(allow: {}).to_h.symbolize_keys.transform_values {|e| e.symbolize_keys} ) if params.dig(:allow)
      @jstree_opts.merge!( params.permit(preload: {}).to_h.symbolize_keys.transform_values {|e| e.symbolize_keys} ) if params.dig(:preload)
      @jstree_opts.merge!( params.permit(selected: {}).to_h.symbolize_keys.transform_values {|e| e.symbolize_keys} ) if params.dig(:selected)
    end

    @jstree_opts
  end

  def jstree_collection
    @jstree_collection ||=
      if jstree_opts_load_organization_guids.blank?
        policy_scope(resource_class)
        super
      elsif jstree_opts_parent_id.eql?('0')
        policy_scope(Organization).where(guid: jstree_opts_load_organization_guids)
      elsif jstree_opts_parent_id.start_with?('v_')
        policy_scope(DataMartVersion).find_by(id: jstree_opts_parent_id_to_d).data_mart_tables.kind_regular.active
      elsif jstree_opts_parent_id.start_with?('t_')
        policy_scope(DataMartTable.kind_regular).find_by(id: jstree_opts_parent_id_to_d).data_attributes.order(:id)
      else
        []
      end
  end

  def jstree_opts_load_organization_guids
    params.dig(:jstree_opts, :load, :organization_guids)
  end

  def jstree_serializer
    @jstree_serializer ||=
      if jstree_opts_load_organization_guids.blank?
        super
      elsif jstree_opts_parent_id.eql?('0')
        Tree::LazyDataAttributes::OrganizationSerializer
      elsif jstree_opts_parent_id.start_with?('v_')
        Tree::LazyDataAttributes::DataMartTableSerializer
      elsif jstree_opts_parent_id.start_with?('t_')
        Tree::LazyDataAttributes::DataAttributeSerializer
      else
        super
      end
  end

end
